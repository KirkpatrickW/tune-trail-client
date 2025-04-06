import { fireEvent, render } from "@testing-library/react-native";
import React, { useEffect } from 'react';
import { View } from 'react-native';
import IndexScreen from "../../../src/app/(screens)/index";

// Define types for the props
type LocalityMapViewProps = {
    onLockStatusChange?: (isLocked: boolean) => void;
    onFetchingGridsChange?: (isFetching: boolean) => void;
    onAreaNameChange?: (name: string) => void;
    ref?: React.RefObject<any>;
};

type MovingTextProps = {
    text: string;
    animationThreshold?: number;
    style?: any;
};

// Mock all dependencies
jest.mock("@/components/maps/LocalityMapView", () => {
    return {
        LocalityMapView: function MockLocalityMapView(props: any) {
            // We can't use React.useEffect here, so we'll call the callbacks directly
            if (props.onLockStatusChange) props.onLockStatusChange(true);
            if (props.onFetchingGridsChange) props.onFetchingGridsChange(false);
            if (props.onAreaNameChange) props.onAreaNameChange("Earth");

            return null;
        }
    };
});

// Mock RadiusSlider with a direct implementation
jest.mock("@/components/maps/RadiusSlider", () => {
    const React = require('react');
    const { View } = require('react-native');

    return {
        __esModule: true,
        default: function MockRadiusSlider() {
            return React.createElement(View, { testID: "radius-slider" });
        }
    };
});

jest.mock("@/components/misc/MovingText", () => {
    return {
        MovingText: function MockMovingText(props: any) {
            return null;
        }
    };
});

jest.mock("@/context/UserSidebarContext", () => ({
    useUserSidebar: () => ({
        toggleUserSidebar: jest.fn()
    })
}));

jest.mock("react-native-safe-area-context", () => ({
    useSafeAreaInsets: () => ({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    })
}));

// Mock FontAwesome6
jest.mock("@expo/vector-icons", () => {
    return {
        FontAwesome6: function MockFontAwesome6() {
            return null;
        }
    };
});

// Create mock components for testing
const MockLocalityMapView = React.forwardRef((props: LocalityMapViewProps, ref) => {
    useEffect(() => {
        if (props.onLockStatusChange) props.onLockStatusChange(true);
        if (props.onFetchingGridsChange) props.onFetchingGridsChange(false);
        if (props.onAreaNameChange) props.onAreaNameChange("Earth");
    }, []);

    return <View testID="locality-map-view" />;
});

const MockMovingText = (props: MovingTextProps) => {
    return <View testID="moving-text">{props.text}</View>;
};

// Override the mocks with our test components
const LocalityMapViewModule = require("@/components/maps/LocalityMapView");
LocalityMapViewModule.LocalityMapView = MockLocalityMapView;

const MovingTextModule = require("@/components/misc/MovingText");
MovingTextModule.MovingText = MockMovingText;

describe("IndexScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders correctly", () => {
        const { getByTestId } = render(<IndexScreen />);

        // Check if main components are rendered
        expect(getByTestId("locality-map-view")).toBeTruthy();
        expect(getByTestId("radius-slider")).toBeTruthy();
        expect(getByTestId("moving-text")).toBeTruthy();
    });

    it("displays the correct area name", () => {
        const { getByTestId } = render(<IndexScreen />);

        // Check if the area name is displayed correctly
        const movingText = getByTestId("moving-text");
        expect(movingText.props.children).toBe("Earth");
    });

    it("toggles user sidebar when user button is pressed", () => {
        const mockToggleUserSidebar = jest.fn();
        jest.spyOn(require("@/context/UserSidebarContext"), "useUserSidebar")
            .mockReturnValue({
                toggleUserSidebar: mockToggleUserSidebar
            });

        const { getByTestId } = render(<IndexScreen />);

        // Find and press the user button
        const userButton = getByTestId("user-button");
        fireEvent.press(userButton);

        // Check if toggleUserSidebar was called
        expect(mockToggleUserSidebar).toHaveBeenCalledTimes(1);
    });

    it("logs message when search button is pressed", () => {
        // Mock console.log
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const { getByTestId } = render(<IndexScreen />);

        // Find and press the search button
        const searchButton = getByTestId("search-button");
        fireEvent.press(searchButton);

        // Check if console.log was called with the correct message
        expect(consoleSpy).toHaveBeenCalledWith("Search button pressed");

        // Restore console.log
        consoleSpy.mockRestore();
    });

    it("calls recenterMap when recenter button is pressed", () => {
        // Create a mock for the recenterMap function
        const mockRecenterMap = jest.fn();

        // Override the default mock for this test
        const LocalityMapViewModule = require("@/components/maps/LocalityMapView");
        const originalLocalityMapView = LocalityMapViewModule.LocalityMapView;

        // Create a ref object with the mock function
        const mockRef = {
            current: {
                recenterMap: mockRecenterMap
            }
        };

        // Override the LocalityMapView to set isMapLocked to false and provide the mock ref
        LocalityMapViewModule.LocalityMapView = React.forwardRef((props: LocalityMapViewProps, ref) => {
            useEffect(() => {
                if (props.onLockStatusChange) props.onLockStatusChange(false);
                // Assign the mock ref to the component's ref
                if (ref) {
                    (ref as React.MutableRefObject<any>).current = mockRef.current;
                }
            }, []);

            return <View testID="locality-map-view" />;
        });

        // Render the component
        const { getByTestId } = render(<IndexScreen />);

        // Find and press the recenter button
        const recenterButton = getByTestId("recenter-button");
        fireEvent.press(recenterButton);

        // Check if recenterMap was called
        expect(mockRecenterMap).toHaveBeenCalledTimes(1);

        // Restore the original mock
        LocalityMapViewModule.LocalityMapView = originalLocalityMapView;
    });

    it("shows recenter button when map is unlocked", () => {
        // Override the default mock for this test
        const LocalityMapViewModule = require("@/components/maps/LocalityMapView");
        const originalLocalityMapView = LocalityMapViewModule.LocalityMapView;

        LocalityMapViewModule.LocalityMapView = React.forwardRef((props: LocalityMapViewProps, ref) => {
            useEffect(() => {
                if (props.onLockStatusChange) props.onLockStatusChange(false);
            }, []);

            return <View testID="locality-map-view" />;
        });

        const { getByTestId } = render(<IndexScreen />);

        // Check if recenter button is displayed
        expect(getByTestId("recenter-button")).toBeTruthy();

        // Restore the original mock
        LocalityMapViewModule.LocalityMapView = originalLocalityMapView;
    });

    it("shows loading indicator when fetching grids", () => {
        // Override the default mock for this test
        const LocalityMapViewModule = require("@/components/maps/LocalityMapView");
        const originalLocalityMapView = LocalityMapViewModule.LocalityMapView;

        LocalityMapViewModule.LocalityMapView = React.forwardRef((props: LocalityMapViewProps, ref) => {
            useEffect(() => {
                if (props.onFetchingGridsChange) props.onFetchingGridsChange(true);
            }, []);

            return <View testID="locality-map-view" />;
        });

        const { getByTestId } = render(<IndexScreen />);

        // Check if loading indicator is displayed
        expect(getByTestId("loading-indicator")).toBeTruthy();

        // Restore the original mock
        LocalityMapViewModule.LocalityMapView = originalLocalityMapView;
    });
}); 