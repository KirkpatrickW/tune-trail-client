import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from 'react';
import { Text, View } from 'react-native';
import LocalityScreen from "../../../../src/app/(screens)/localities/[id]";

// Mock all dependencies
jest.mock("@/api/localityService", () => {
    return {
        localityService: {
            getTracksInLocality: jest.fn().mockResolvedValue({
                data: [
                    {
                        locality_track_id: 1,
                        track_id: "track1",
                        spotify_id: "spotify1",
                        name: "Test Track 1",
                        artists: ["Artist 1"],
                        cover: {
                            small: "small1.jpg",
                            medium: "medium1.jpg",
                            large: "large1.jpg"
                        },
                        username: "user1",
                        total_votes: 10,
                        user_vote: 0
                    },
                    {
                        locality_track_id: 2,
                        track_id: "track2",
                        spotify_id: "spotify2",
                        name: "Test Track 2",
                        artists: ["Artist 2"],
                        cover: {
                            small: "small2.jpg",
                            medium: "medium2.jpg",
                            large: "large2.jpg"
                        },
                        username: "user2",
                        total_votes: 5,
                        user_vote: 1
                    }
                ]
            })
        }
    };
});

jest.mock("@/api/localityTrackService", () => {
    return {
        localityTrackService: {
            voteOnLocalityTrack: jest.fn().mockResolvedValue({})
        }
    };
});

jest.mock("@/components/misc/MovingText", () => {
    return {
        MovingText: function MockMovingText() {
            return null;
        }
    };
});

jest.mock("@/components/tracks/SearchTracksModal", () => {
    return {
        SearchTracksModal: function MockSearchTracksModal() {
            return null;
        }
    };
});

jest.mock("@/context/AuthContext", () => {
    return {
        useAuth: () => ({
            isAuthenticated: true
        })
    };
});

jest.mock("@/context/PlayerContext", () => {
    return {
        usePlayer: () => ({
            currentLocality: { locality_id: "123" },
            currentTrack: { track_id: "track1" }
        })
    };
});

jest.mock("expo-router", () => {
    const mockRouter = {
        back: jest.fn()
    };
    return {
        useLocalSearchParams: () => ({
            id: "123",
            name: "Test Locality"
        }),
        useRouter: () => mockRouter
    };
});

jest.mock("react-native-safe-area-context", () => {
    return {
        useSafeAreaInsets: () => ({
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        })
    };
});

jest.mock("@expo/vector-icons", () => {
    return {
        FontAwesome: function MockFontAwesome() {
            return null;
        }
    };
});

jest.mock("react-native-fast-image", () => {
    return function MockFastImage() {
        return null;
    };
});

// Create mock components for testing
const MockMovingText = (props: any) => {
    return <Text testID="moving-text">{props.text}</Text>;
};

const MockSearchTracksModal = () => {
    return <View testID="search-tracks-modal" />;
};

const MockFastImage = () => {
    return <View testID="fast-image" />;
};

// Override the mocks with our test components
const MovingTextModule = require("@/components/misc/MovingText");
MovingTextModule.MovingText = MockMovingText;

const SearchTracksModalModule = require("@/components/tracks/SearchTracksModal");
SearchTracksModalModule.SearchTracksModal = MockSearchTracksModal;

const FastImageModule = require("react-native-fast-image");
FastImageModule.default = MockFastImage;

// Mock FlatList to render its children directly
jest.mock("react-native", () => {
    const React = require('react');
    return {
        View: 'View',
        Text: 'Text',
        TouchableOpacity: 'TouchableOpacity',
        ActivityIndicator: 'ActivityIndicator',
        StyleSheet: {
            create: (styles: any) => styles,
            flatten: (style: any) => style,
        },
        FlatList: ({ data, renderItem, ListEmptyComponent, keyExtractor }: any) => {
            if (!data || data.length === 0) {
                return ListEmptyComponent;
            }
            return React.createElement('View', {},
                data.map((item: any, index: number) => (
                    React.createElement('View', {
                        key: keyExtractor ? keyExtractor(item, index) : item.track_id,
                        children: renderItem({ item, index })
                    })
                ))
            );
        }
    };
});

describe("LocalityScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders correctly with tracks", async () => {
        const { getByText, getByTestId } = render(<LocalityScreen />);

        // Wait for the component to load data
        await waitFor(() => {
            expect(getByText("Test Track 1")).toBeTruthy();
        });

        // Check if main components are rendered
        await waitFor(() => {
            expect(getByTestId("back-button")).toBeTruthy();
            expect(getByTestId("refresh-button")).toBeTruthy();
            expect(getByTestId("add-track-button")).toBeTruthy();
            expect(getByTestId("moving-text")).toBeTruthy();
        });

        // Check if track items are rendered
        await waitFor(() => {
            expect(getByText("Test Track 1")).toBeTruthy();
            expect(getByText("Test Track 2")).toBeTruthy();
            expect(getByText("Artist 1")).toBeTruthy();
            expect(getByText("Artist 2")).toBeTruthy();
        });
    });

    it("displays the correct locality name", async () => {
        const { getByTestId } = render(<LocalityScreen />);

        // Check if the locality name is displayed correctly
        await waitFor(() => {
            const movingText = getByTestId("moving-text");
            expect(movingText.props.children).toBe("Test Locality");
        });
    });

    it("shows empty state when no tracks are available", async () => {
        // Override the mock to return empty data
        const localityService = require("@/api/localityService").localityService;
        localityService.getTracksInLocality.mockResolvedValueOnce({ data: [] });

        const { getByText } = render(<LocalityScreen />);

        // Wait for the component to load data
        await waitFor(() => {
            expect(getByText("This stage is all yours")).toBeTruthy();
        });

        // Check if empty state is displayed
        await waitFor(() => {
            expect(getByText("This stage is all yours")).toBeTruthy();
            expect(getByText("Test Locality's playlist is currently powered by awkward silence - want to fix that?")).toBeTruthy();
        });
    });

    it("opens search tracks modal when add track button is pressed", async () => {
        const { getByTestId } = render(<LocalityScreen />);

        // Wait for the component to load data
        await waitFor(() => {
            expect(getByTestId("add-track-button")).toBeTruthy();
        });

        // Find and press the add track button
        const addTrackButton = getByTestId("add-track-button");
        await act(async () => {
            fireEvent.press(addTrackButton);
        });

        // Check if search tracks modal is displayed
        await waitFor(() => {
            expect(getByTestId("search-tracks-modal")).toBeTruthy();
        });
    });

    it("handles upvoting a track", async () => {
        const localityTrackService = require("@/api/localityTrackService").localityTrackService;

        const { getByTestId } = render(<LocalityScreen />);

        // Wait for the component to load data
        await waitFor(() => {
            expect(getByTestId("upvote-button-1")).toBeTruthy();
        });

        // Find and press the upvote button for the first track
        const upvoteButton = getByTestId("upvote-button-1");
        await act(async () => {
            fireEvent.press(upvoteButton);
        });

        // Check if voteOnLocalityTrack was called with the correct parameters
        await waitFor(() => {
            expect(localityTrackService.voteOnLocalityTrack).toHaveBeenCalledWith(1, 1);
        });
    });

    it("handles downvoting a track", async () => {
        const localityTrackService = require("@/api/localityTrackService").localityTrackService;

        const { getByTestId } = render(<LocalityScreen />);

        // Wait for the component to load data
        await waitFor(() => {
            expect(getByTestId("downvote-button-1")).toBeTruthy();
        });

        // Find and press the downvote button for the first track
        const downvoteButton = getByTestId("downvote-button-1");
        await act(async () => {
            fireEvent.press(downvoteButton);
        });

        // Check if voteOnLocalityTrack was called with the correct parameters
        await waitFor(() => {
            expect(localityTrackService.voteOnLocalityTrack).toHaveBeenCalledWith(1, -1);
        });
    });

    it("refreshes tracks when refresh button is pressed", async () => {
        const localityService = require("@/api/localityService").localityService;

        const { getByTestId } = render(<LocalityScreen />);

        // Wait for the component to load data
        await waitFor(() => {
            expect(getByTestId("refresh-button")).toBeTruthy();
        });

        // Find and press the refresh button
        const refreshButton = getByTestId("refresh-button");
        await act(async () => {
            fireEvent.press(refreshButton);
        });

        // Check if getTracksInLocality was called
        await waitFor(() => {
            expect(localityService.getTracksInLocality).toHaveBeenCalledWith("123");
        });
    });

    it("navigates back when back button is pressed", async () => {
        const router = require("expo-router").useRouter();

        const { getByTestId } = render(<LocalityScreen />);

        // Wait for the component to load data
        await waitFor(() => {
            expect(getByTestId("back-button")).toBeTruthy();
        });

        // Find and press the back button
        const backButton = getByTestId("back-button");
        await act(async () => {
            fireEvent.press(backButton);
        });

        // Check if router.back was called
        await waitFor(() => {
            expect(router.back).toHaveBeenCalled();
        });
    });

    it("formats vote count correctly", async () => {
        const { getByText } = render(<LocalityScreen />);

        // Wait for the component to load data
        await waitFor(() => {
            expect(getByText("10")).toBeTruthy();
        });

        // Check if vote counts are formatted correctly
        await waitFor(() => {
            expect(getByText("10")).toBeTruthy(); // Normal vote count
            expect(getByText("5")).toBeTruthy(); // Normal vote count
        });

        // Test with a vote count > 999
        const localityService = require("@/api/localityService").localityService;
        localityService.getTracksInLocality.mockResolvedValueOnce({
            data: [
                {
                    locality_track_id: 1,
                    track_id: "track1",
                    spotify_id: "spotify1",
                    name: "Test Track 1",
                    artists: ["Artist 1"],
                    cover: {
                        small: "small1.jpg",
                        medium: "medium1.jpg",
                        large: "large1.jpg"
                    },
                    username: "user1",
                    total_votes: 1000,
                    user_vote: 0
                }
            ]
        });

        const { getByText: getByTextAfterUpdate } = render(<LocalityScreen />);

        // Wait for the component to load data
        await waitFor(() => {
            expect(getByTextAfterUpdate("999+")).toBeTruthy();
        });

        await waitFor(() => {
            expect(getByTextAfterUpdate("999+")).toBeTruthy(); // Formatted vote count
        });
    });

    it("closes search tracks modal when onClose is called", async () => {
        // Create a spy on the SearchTracksModal component
        const SearchTracksModalModule = require("@/components/tracks/SearchTracksModal");
        const originalSearchTracksModal = SearchTracksModalModule.SearchTracksModal;

        // Create a variable to store the onClose function
        let capturedOnClose: (() => void) | null = null;

        // Override the SearchTracksModal component to capture its props
        SearchTracksModalModule.SearchTracksModal = function MockSearchTracksModal(props: any) {
            // Store the onClose function
            capturedOnClose = props.onClose;
            return <View testID="search-tracks-modal" />;
        };

        const { getByTestId } = render(<LocalityScreen />);

        // Wait for the component to load data
        await waitFor(() => {
            expect(getByTestId("add-track-button")).toBeTruthy();
        });

        // Find and press the add track button to open the modal
        const addTrackButton = getByTestId("add-track-button");
        await act(async () => {
            fireEvent.press(addTrackButton);
        });

        // Check if search tracks modal is displayed
        await waitFor(() => {
            expect(getByTestId("search-tracks-modal")).toBeTruthy();
        });

        // Call the captured onClose function
        expect(capturedOnClose).not.toBeNull();
        await act(async () => {
            capturedOnClose!();
        });

        // Restore the original SearchTracksModal component
        SearchTracksModalModule.SearchTracksModal = originalSearchTracksModal;
    });
}); 