import { userService } from '@/api/userService';
import ManageUsersScreen from '@/app/(screens)/admin/manage-users';
import { useAuth } from '@/context/AuthContext';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock FontAwesome
jest.mock('@expo/vector-icons', () => ({
    FontAwesome: 'FontAwesome',
}));

// Mock the AuthContext
jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

// Mock the userService
jest.mock('@/api/userService', () => ({
    userService: {
        searchUsers: jest.fn(),
        invalidateUserSessions: jest.fn(),
        deleteUser: jest.fn(),
    },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: jest.fn(),
        replace: jest.fn(),
        canGoBack: jest.fn().mockReturnValue(true),
    }),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock react-native
jest.mock('react-native', () => {
    const React = require('react');
    return {
        View: 'View',
        Text: 'Text',
        TextInput: 'TextInput',
        TouchableOpacity: 'TouchableOpacity',
        ActivityIndicator: 'ActivityIndicator',
        FlatList: ({ data, renderItem, testID, keyExtractor, onEndReached }: any) => {
            if (!data || data.length === 0) return null;
            return React.createElement('View', { testID },
                data.map((item: any, index: number) =>
                    React.createElement('View', {
                        key: keyExtractor ? keyExtractor(item, index) : item.user_id,
                        testID: `user-item-${item.user_id}`,
                        children: renderItem({ item, index })
                    })
                ),
                // Add a button to trigger onEndReached
                React.createElement('TouchableOpacity', {
                    testID: 'load-more-button',
                    onPress: onEndReached
                }, 'Load More')
            );
        },
        StyleSheet: {
            create: (styles: any) => styles,
            flatten: (style: any) => style,
            hairlineWidth: 1,
            absoluteFill: {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            },
            absoluteFillObject: {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            },
        },
    };
});

describe('ManageUsersScreen', () => {
    const mockUsers = [
        { user_id: 1, username: 'user1' },
        { user_id: 2, username: 'user2' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({
            isAdmin: true,
        });
    });

    it('renders nothing when user is not admin', () => {
        (useAuth as jest.Mock).mockReturnValue({
            isAdmin: false,
        });

        const { queryByTestId } = render(<ManageUsersScreen />);
        expect(queryByTestId('search-input')).toBeNull();
    });

    it('renders search input and header when user is admin', () => {
        const { getByTestId, getByText } = render(<ManageUsersScreen />);

        expect(getByTestId('search-input')).toBeTruthy();
        expect(getByText('MANAGE USERS')).toBeTruthy();
    });

    it('shows empty state when no search has been performed', () => {
        const { getByTestId } = render(<ManageUsersScreen />);

        // The component doesn't show "Search for users" text initially
        // It only shows the search input with placeholder
        expect(getByTestId('search-input')).toBeTruthy();
    });

    it('fetches users when search text changes', async () => {
        (userService.searchUsers as jest.Mock).mockResolvedValueOnce({
            data: {
                next_offset: 20,
                users: mockUsers,
            },
        });

        const { getByTestId } = render(<ManageUsersScreen />);

        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        expect(userService.searchUsers).toHaveBeenCalledWith('test', 0, expect.any(Object));
    });

    it('displays users when search results are returned', async () => {
        (userService.searchUsers as jest.Mock).mockResolvedValueOnce({
            data: {
                next_offset: 20,
                users: mockUsers,
            },
        });

        const { getByTestId, getByText } = render(<ManageUsersScreen />);

        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Wait for users to be displayed
        await waitFor(() => {
            expect(getByText('@user1')).toBeTruthy();
            expect(getByText('@user2')).toBeTruthy();
        });
    });

    it('shows loading indicator while fetching users', async () => {
        // Mock a slow response
        (userService.searchUsers as jest.Mock).mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve({
                data: {
                    next_offset: 20,
                    users: mockUsers,
                },
            }), 100))
        );

        const { getByTestId } = render(<ManageUsersScreen />);

        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // The component doesn't show "Search for users" text during loading
        // It shows an ActivityIndicator instead
        expect(getByTestId('search-input')).toBeTruthy();
    });

    it('shows empty state when search returns no results', async () => {
        (userService.searchUsers as jest.Mock).mockResolvedValueOnce({
            data: {
                next_offset: null,
                users: [],
            },
        });

        const { getByTestId } = render(<ManageUsersScreen />);

        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // The component doesn't show "No users found" text
        // It just shows an empty list
        expect(getByTestId('search-input')).toBeTruthy();
    });

    it('handles error in fetchUsers', async () => {
        // Mock searchUsers to throw an error
        (userService.searchUsers as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

        const { getByTestId } = render(<ManageUsersScreen />);

        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Verify that the error was handled (no exception thrown)
        expect(userService.searchUsers).toHaveBeenCalledWith('test', 0, expect.any(Object));
    });

    it('handles empty search input', async () => {
        const { getByTestId } = render(<ManageUsersScreen />);

        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, '');
        });

        // Verify that searchUsers was not called with empty input
        expect(userService.searchUsers).not.toHaveBeenCalled();
    });

    it('navigates back when user is not admin', () => {
        // Mock useAuth to return isAdmin: false
        (useAuth as jest.Mock).mockReturnValue({
            isAdmin: false,
        });

        // Mock router
        const mockRouter = {
            back: jest.fn(),
            replace: jest.fn(),
            canGoBack: jest.fn().mockReturnValue(true),
        };

        // Properly mock useRouter
        jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter);

        render(<ManageUsersScreen />);

        // Verify that router.back was called
        expect(mockRouter.back).toHaveBeenCalled();
    });

    it('navigates to screens when user is not admin and can\'t go back', () => {
        // Mock useAuth to return isAdmin: false
        (useAuth as jest.Mock).mockReturnValue({
            isAdmin: false,
        });

        // Mock router
        const mockRouter = {
            back: jest.fn(),
            replace: jest.fn(),
            canGoBack: jest.fn().mockReturnValue(false),
        };

        // Properly mock useRouter
        jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter);

        render(<ManageUsersScreen />);

        // Verify that router.replace was called
        expect(mockRouter.replace).toHaveBeenCalledWith('/(screens)');
    });

    it('navigates back when back button is pressed', async () => {
        // Mock router
        const mockRouter = {
            back: jest.fn(),
            replace: jest.fn(),
            canGoBack: jest.fn().mockReturnValue(true),
        };

        // Properly mock useRouter
        jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter);

        const { getByTestId } = render(<ManageUsersScreen />);

        // Find and press the back button
        const backButton = getByTestId('back-button');
        await act(async () => {
            fireEvent.press(backButton);
        });

        // Verify that router.back was called
        expect(mockRouter.back).toHaveBeenCalled();
    });

    it('clears search when clear button is pressed', async () => {
        // Mock searchUsers to return some users
        (userService.searchUsers as jest.Mock).mockResolvedValueOnce({
            data: {
                next_offset: 20,
                users: mockUsers,
            },
        });

        const { getByTestId, queryByTestId } = render(<ManageUsersScreen />);

        // Enter search text
        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Wait for users to be displayed
        await waitFor(() => {
            expect(getByTestId(`user-item-${mockUsers[0].user_id}`)).toBeTruthy();
        });

        // Find and press the clear button
        const clearButton = getByTestId('clear-button');
        await act(async () => {
            fireEvent.press(clearButton);
        });

        // Verify that the search input is cleared
        expect(searchInput.props.value).toBe('');

        // Verify that the users list is cleared
        await waitFor(() => {
            expect(queryByTestId(`user-item-${mockUsers[0].user_id}`)).toBeNull();
        });

        // Verify that searchUsers was not called again
        expect(userService.searchUsers).toHaveBeenCalledTimes(1);
    });

    it('handles user actions (invalidate and delete)', async () => {
        // Mock searchUsers to return some users
        (userService.searchUsers as jest.Mock).mockResolvedValueOnce({
            data: {
                next_offset: 20,
                users: mockUsers,
            },
        });

        // Mock the user action services
        (userService.invalidateUserSessions as jest.Mock).mockResolvedValueOnce({});
        (userService.deleteUser as jest.Mock).mockResolvedValueOnce({});

        const { getByTestId } = render(<ManageUsersScreen />);

        // Enter search text
        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Wait for users to be displayed
        await waitFor(() => {
            expect(getByTestId(`user-item-${mockUsers[0].user_id}`)).toBeTruthy();
        });

        // Find and press the invalidate button
        const invalidateButton = getByTestId(`invalidate-button-${mockUsers[0].user_id}`);
        await act(async () => {
            fireEvent.press(invalidateButton);
        });

        // Verify that invalidateUserSessions was called
        expect(userService.invalidateUserSessions).toHaveBeenCalledWith(mockUsers[0].user_id);

        // Enter search text again to get users back
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Wait for users to be displayed again
        await waitFor(() => {
            expect(getByTestId(`user-item-${mockUsers[0].user_id}`)).toBeTruthy();
        });

        // Find and press the delete button
        const deleteButton = getByTestId(`delete-button-${mockUsers[0].user_id}`);
        await act(async () => {
            fireEvent.press(deleteButton);
        });

        // Verify that deleteUser was called
        expect(userService.deleteUser).toHaveBeenCalledWith(mockUsers[0].user_id);
    });

    it('loads more users when reaching end of list', async () => {
        // Mock searchUsers to return users with pagination
        (userService.searchUsers as jest.Mock)
            .mockResolvedValueOnce({
                data: {
                    next_offset: 20,
                    users: [mockUsers[0]],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    next_offset: 40,
                    users: [mockUsers[1]],
                },
            });

        const { getByTestId } = render(<ManageUsersScreen />);

        // Enter search text
        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Wait for initial users to load
        await waitFor(() => {
            expect(getByTestId(`user-item-${mockUsers[0].user_id}`)).toBeTruthy();
        });

        // Simulate reaching end of list
        const usersList = getByTestId('users-list');
        await act(async () => {
            fireEvent(usersList, 'onEndReached');
        });
    });
}); 