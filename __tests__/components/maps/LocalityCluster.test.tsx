import { render } from '@testing-library/react-native';
import React from 'react';
import { supercluster } from 'react-native-clusterer';
import MapView from 'react-native-maps';
import { LocalityCluster } from '../../../src/components/maps/LocalityCluster';

jest.mock('react-native-maps', () => {
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: View,
        Marker: (props: any) => <View {...props} />,
    };
});

describe('LocalityCluster', () => {
    const mockMapRef = React.createRef<MapView>();
    const mockClusterFeature: supercluster.ClusterFeature<any> = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [0, 0],
        },
        properties: {
            point_count: 5,
            getExpansionRegion: jest.fn().mockReturnValue({
                latitude: 0,
                longitude: 0,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            }),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with cluster feature', () => {
        const { getByTestId } = render(
            <LocalityCluster
                clusterFeature={mockClusterFeature}
                mapRef={mockMapRef}
            />
        );

        const clusterContainer = getByTestId('cluster-container');
        expect(clusterContainer).toBeTruthy();
    });

    it('displays correct point count', () => {
        const { getByText } = render(
            <LocalityCluster
                clusterFeature={mockClusterFeature}
                mapRef={mockMapRef}
            />
        );

        expect(getByText('5')).toBeTruthy();
    });

    it('handles cluster press correctly', () => {
        const { getByTestId } = render(
            <LocalityCluster
                clusterFeature={mockClusterFeature}
                mapRef={mockMapRef}
            />
        );

        const marker = getByTestId('cluster-marker');
        marker.props.onPress();

        expect(mockClusterFeature.properties.getExpansionRegion).toHaveBeenCalled();
    });

    it('calls animateToRegion when mapRef is available', () => {
        const mockAnimateToRegion = jest.fn();
        const mockMapRef = {
            current: {
                animateToRegion: mockAnimateToRegion,
            } as unknown as MapView,
        } as React.RefObject<MapView>;

        const { getByTestId } = render(
            <LocalityCluster
                clusterFeature={mockClusterFeature}
                mapRef={mockMapRef}
            />
        );

        const marker = getByTestId('cluster-marker');
        marker.props.onPress();

        expect(mockAnimateToRegion).toHaveBeenCalledWith(
            mockClusterFeature.properties.getExpansionRegion(),
            1000
        );
    });

    it('does not re-render when props are unchanged', () => {
        const { rerender, getByTestId } = render(
            <LocalityCluster
                clusterFeature={mockClusterFeature}
                mapRef={mockMapRef}
            />
        );

        const firstRender = getByTestId('cluster-container');

        rerender(
            <LocalityCluster
                clusterFeature={mockClusterFeature}
                mapRef={mockMapRef}
            />
        );

        const secondRender = getByTestId('cluster-container');
        expect(firstRender).toBe(secondRender);
    });
}); 