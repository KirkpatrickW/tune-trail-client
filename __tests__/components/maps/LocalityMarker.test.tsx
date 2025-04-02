import { render } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import { supercluster } from 'react-native-clusterer';
import { LocalityMarker } from '../../../src/components/maps/LocalityMarker';

jest.mock('expo-router', () => ({
    router: {
        push: jest.fn(),
    },
}));

jest.mock('react-native-maps', () => {
    const { View } = require('react-native');
    return {
        Marker: (props: any) => <View {...props} />,
    };
});

describe('LocalityMarker', () => {
    const mockPointFeature: supercluster.PointFeature<any> = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [0, 0],
        },
        properties: {
            id: '123',
            name: 'Test Locality',
            total_tracks: 5,
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with tracks', () => {
        const { getByTestId, getByText } = render(
            <LocalityMarker pointFeature={mockPointFeature} />
        );

        const marker = getByTestId('locality-marker');
        expect(marker).toBeTruthy();
        expect(getByText('Test Locality')).toBeTruthy();
        expect(getByText('5')).toBeTruthy();
    });

    it('renders correctly without tracks', () => {
        const pointFeatureWithoutTracks = {
            ...mockPointFeature,
            properties: {
                ...mockPointFeature.properties,
                total_tracks: 0,
            },
        };

        const { getByTestId, getByText, queryByTestId } = render(
            <LocalityMarker pointFeature={pointFeatureWithoutTracks} />
        );

        const marker = getByTestId('locality-marker');
        expect(marker).toBeTruthy();
        expect(getByText('Test Locality')).toBeTruthy();
        expect(queryByTestId('track-count-badge')).toBeNull();
    });

    it('displays 99+ when track count exceeds 99', () => {
        const pointFeatureWithManyTracks = {
            ...mockPointFeature,
            properties: {
                ...mockPointFeature.properties,
                total_tracks: 100,
            },
        };

        const { getByText } = render(
            <LocalityMarker pointFeature={pointFeatureWithManyTracks} />
        );

        expect(getByText('99+')).toBeTruthy();
    });

    it('navigates to locality details on press', () => {
        const { getByTestId } = render(
            <LocalityMarker pointFeature={mockPointFeature} />
        );

        const marker = getByTestId('locality-marker');
        marker.props.onPress();

        expect(router.push).toHaveBeenCalledWith({
            pathname: '/localities/[id]',
            params: {
                id: mockPointFeature.properties.id,
                name: mockPointFeature.properties.name,
            },
        });
    });

    it('does not re-render when props are unchanged', () => {
        const { rerender, getByTestId } = render(
            <LocalityMarker pointFeature={mockPointFeature} />
        );

        const firstRender = getByTestId('locality-marker');

        rerender(
            <LocalityMarker pointFeature={mockPointFeature} />
        );

        const secondRender = getByTestId('locality-marker');
        expect(firstRender).toBe(secondRender);
    });
}); 