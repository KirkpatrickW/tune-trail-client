// __tests__/apiClient.test.ts
import { parseBackendError } from '@/utils/errorUtils';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

// Mock dependencies BEFORE importing the module we're testing
jest.mock('axios', () => {
    const mockAxiosInstance = Object.assign(jest.fn(), {
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
        defaults: {
            headers: {
                common: {},
            },
        },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    });

    return {
        create: jest.fn(() => mockAxiosInstance),
        put: jest.fn(),
        // optionally mock others here like `get` globally if needed
    };
});

jest.mock('expo-secure-store');
jest.mock('react-native-toast-message');
jest.mock('@/utils/errorUtils', () => ({
    parseBackendError: jest.fn(() => ['Something went wrong']),
}));

// Now import the module we're testing
import apiClient, { configureApiClient } from '@/api/apiClient';

// Mock functions for AuthContext methods
const mockSetAuthData = jest.fn().mockResolvedValue(undefined);
const mockClearAuthData = jest.fn().mockResolvedValue(undefined);
const mockShowSessionUnavailableModal = jest.fn();

// Variables to store the actual interceptors
let requestInterceptor: any;
let responseSuccessInterceptor: any;
let responseErrorInterceptor: any;

describe('apiClient', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Configure apiClient with mock functions
        configureApiClient({
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
            showSessionUnavailableModal: mockShowSessionUnavailableModal,
        });

        // Capture the actual interceptors when they're registered
        const mockAxiosInstance = (axios.create as jest.Mock)();
        mockAxiosInstance.interceptors.request.use.mockImplementation((fn: (config: any) => any) => {
            requestInterceptor = fn;
            return 0; // Return a number as the interceptor ID
        });

        mockAxiosInstance.interceptors.response.use.mockImplementation(
            (successFn: (response: any) => any, errorFn: (error: any) => any) => {
                responseSuccessInterceptor = successFn;
                responseErrorInterceptor = errorFn;
                return 0; // Return a number as the interceptor ID
            }
        );

        // Re-import the module to trigger the interceptors to be registered
        jest.isolateModules(() => {
            const { configureApiClient } = require('@/api/apiClient');
            configureApiClient({
                setAuthData: mockSetAuthData,
                clearAuthData: mockClearAuthData,
                showSessionUnavailableModal: mockShowSessionUnavailableModal,
            });
        });
    });

    it('should add Authorization header if access token exists', async () => {
        // Mock SecureStore.getItemAsync to return a token
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');

        // Create a config object
        const config = { headers: {} };

        // Call the request interceptor
        const result = await requestInterceptor(config);

        // Verify that the Authorization header was added
        expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should handle request interceptor errors', async () => {
        // Create an error object
        const error = new Error('Request error');

        // Get the error handler from the request interceptor
        const mockAxiosInstance = (axios.create as jest.Mock)();
        const errorHandler = mockAxiosInstance.interceptors.request.use.mock.calls[0][1];

        // Call the error handler and expect it to reject with the error
        await expect(errorHandler(error)).rejects.toBe(error);
    });

    it('should show a success toast if showToast is true and response has a message', () => {
        // Create a response object
        const response = {
            config: { showToast: true },
            data: { message: 'Success message' },
        };

        // Call the success response interceptor
        const result = responseSuccessInterceptor(response);

        // Verify that Toast.show was called with the correct parameters
        expect(Toast.show).toHaveBeenCalledWith({
            type: 'success',
            text1: 'Success!',
            text2: 'Success message',
        });

        // Verify that the response was returned
        expect(result).toBe(response);
    });

    it('should not show a success toast if showToast is false', () => {
        // Create a response object
        const response = {
            config: { showToast: false },
            data: { message: 'Success message' },
        };

        // Call the success response interceptor
        const result = responseSuccessInterceptor(response);

        // Verify that Toast.show was not called
        expect(Toast.show).not.toHaveBeenCalled();

        // Verify that the response was returned
        expect(result).toBe(response);
    });

    it('should handle 401 errors by refreshing the token', async () => {
        // Mock SecureStore.getItemAsync to return a token
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');

        // Mock axios.put to return a successful response
        (axios.put as jest.Mock).mockResolvedValue({
            data: {
                access_token: 'new-token',
                user_details: { id: 1, username: 'test' },
            },
        });

        // Create an error object
        const error = {
            response: { status: 401 },
            config: { _retry: false, headers: {} },
        };

        // Mock apiClient to return a successful response
        const mockApiClientResponse = { data: 'success' };
        (apiClient as unknown as jest.Mock).mockResolvedValue(mockApiClientResponse);

        // Call the error response interceptor
        const result = await responseErrorInterceptor(error);

        // Verify that axios.put was called with the correct parameters
        expect(axios.put).toHaveBeenCalledWith(
            'http://10.0.2.2:8000/auth/refresh-token',
            {},
            {
                headers: {
                    Authorization: 'Bearer test-token',
                },
            }
        );

        // Verify that setAuthData was called with the correct parameters
        expect(mockSetAuthData).toHaveBeenCalledWith(
            { id: 1, username: 'test' },
            'new-token'
        );

        // Verify that the result is the mock response
        expect(result).toBe(mockApiClientResponse);
    });

    it('should reject the promise if token refresh fails', async () => {
        // Mock SecureStore.getItemAsync to return a token
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');

        // Mock axios.put to return an error
        (axios.put as jest.Mock).mockRejectedValue(new Error('Token refresh failed'));

        // Create an error object
        const error = {
            response: { status: 401 },
            config: { _retry: false, headers: {} },
        };

        // Call the error response interceptor and expect it to reject
        await expect(responseErrorInterceptor(error)).rejects.toThrow('Token refresh failed');

        // Verify that clearAuthData was called
        expect(mockClearAuthData).toHaveBeenCalled();

        // Verify that showSessionUnavailableModal was called
        expect(mockShowSessionUnavailableModal).toHaveBeenCalled();
    });

    it('should show an error toast if showToast is true and error has a response', () => {
        // Mock parseBackendError to return an array of errors
        (parseBackendError as jest.Mock).mockReturnValue(['Error 1', 'Error 2']);

        // Create an error object
        const error = {
            response: {
                status: 400,
                data: { detail: 'Error details' }
            },
            config: { showToast: true },
        };

        // Call the error response interceptor and expect it to reject
        expect(responseErrorInterceptor(error)).rejects.toBe(error);

        // Verify that parseBackendError was called with the correct parameters
        expect(parseBackendError).toHaveBeenCalledWith('Error details');

        // Verify that Toast.show was called with the correct parameters
        expect(Toast.show).toHaveBeenCalledWith({
            type: 'error',
            text1: 'Error 400',
            text2: '• Error 1\n• Error 2',
        });
    });

    it('should format error toast message correctly for single error', () => {
        // Mock parseBackendError to return a single error
        (parseBackendError as jest.Mock).mockReturnValue(['Single error']);

        // Create an error object
        const error = {
            response: {
                status: 400,
                data: { detail: 'Error details' }
            },
            config: { showToast: true },
        };

        // Call the error response interceptor and expect it to reject
        expect(responseErrorInterceptor(error)).rejects.toBe(error);

        // Verify that Toast.show was called with the correct parameters
        expect(Toast.show).toHaveBeenCalledWith({
            type: 'error',
            text1: 'Error 400',
            text2: 'Single error',
        });
    });

    it('should not show an error toast if showToast is false', () => {
        // Create an error object
        const error = {
            response: {
                status: 400,
                data: { detail: 'Error details' }
            },
            config: { showToast: false },
        };

        // Call the error response interceptor and expect it to reject
        expect(responseErrorInterceptor(error)).rejects.toBe(error);

        // Verify that Toast.show was not called
        expect(Toast.show).not.toHaveBeenCalled();
    });

    it('should handle multiple requests during token refresh', async () => {
        // Mock SecureStore.getItemAsync to return a token
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');

        // Mock axios.put to return a successful response
        (axios.put as jest.Mock).mockResolvedValue({
            data: {
                access_token: 'new-token',
                user_details: { id: 1, username: 'test' },
            },
        });

        // Create error objects
        const error1 = {
            response: { status: 401 },
            config: { _retry: false, headers: {} },
        };

        const error2 = {
            response: { status: 401 },
            config: { _retry: false, headers: {} },
        };

        // Mock apiClient to return successful responses
        const mockApiClientResponse1 = { data: 'success1' };
        const mockApiClientResponse2 = { data: 'success2' };
        (apiClient as unknown as jest.Mock)
            .mockResolvedValueOnce(mockApiClientResponse1)
            .mockResolvedValueOnce(mockApiClientResponse2);

        // Call the error response interceptor twice
        const promise1 = responseErrorInterceptor(error1);
        const promise2 = responseErrorInterceptor(error2);

        // Wait for both promises to resolve
        const results = await Promise.all([promise1, promise2]);

        // Verify that axios.put was called only once
        expect(axios.put).toHaveBeenCalledTimes(1);

        // Verify that both promises resolved successfully
        expect(results[0]).toBe(mockApiClientResponse1);
        expect(results[1]).toBe(mockApiClientResponse2);
    });

    it('should handle the case when there is no access token during token refresh', async () => {
        // Mock SecureStore.getItemAsync to return null (no token)
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

        // Create an error object
        const error = {
            response: { status: 401 },
            config: { _retry: false, headers: {} },
        };

        // Call the error response interceptor and expect it to reject
        await expect(responseErrorInterceptor(error)).rejects.toBe(error);

        // Verify that axios.put was not called
        expect(axios.put).not.toHaveBeenCalled();

        // Verify that setAuthData was not called
        expect(mockSetAuthData).not.toHaveBeenCalled();
    });

    it('should handle the case when the request has already been retried', async () => {
        // Create an error object
        const error = {
            response: { status: 401 },
            config: { _retry: true, headers: {} },
        };

        // Call the error response interceptor and expect it to reject
        await expect(responseErrorInterceptor(error)).rejects.toBe(error);

        // Verify that axios.put was not called
        expect(axios.put).not.toHaveBeenCalled();

        // Verify that setAuthData was not called
        expect(mockSetAuthData).not.toHaveBeenCalled();
    });

    it('should handle non-401 errors', async () => {
        // Create an error object
        const error = {
            response: { status: 500 },
            config: { _retry: false, headers: {} },
        };

        // Call the error response interceptor and expect it to reject
        await expect(responseErrorInterceptor(error)).rejects.toBe(error);

        // Verify that axios.put was not called
        expect(axios.put).not.toHaveBeenCalled();

        // Verify that setAuthData was not called
        expect(mockSetAuthData).not.toHaveBeenCalled();
    });

    it('should process queue with error when token refresh fails', async () => {
        // Mock SecureStore.getItemAsync to return a token
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');

        // Mock axios.put to return an error
        (axios.put as jest.Mock).mockRejectedValue(new Error('Token refresh failed'));

        // Create error objects
        const error1 = {
            response: { status: 401 },
            config: { _retry: false, headers: {} },
        };

        const error2 = {
            response: { status: 401 },
            config: { _retry: false, headers: {} },
        };

        // Call the error response interceptor twice
        const promise1 = responseErrorInterceptor(error1);
        const promise2 = responseErrorInterceptor(error2);

        // Wait for both promises to reject
        await expect(Promise.all([promise1, promise2])).rejects.toThrow('Token refresh failed');

        // Verify that axios.put was called only once
        expect(axios.put).toHaveBeenCalledTimes(1);

        // Verify that clearAuthData was called
        expect(mockClearAuthData).toHaveBeenCalled();

        // Verify that showSessionUnavailableModal was called
        expect(mockShowSessionUnavailableModal).toHaveBeenCalled();
    });

    it('should set isRefreshing flag during token refresh', async () => {
        // Mock SecureStore.getItemAsync to return a token
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');

        // Mock axios.put to return a successful response after a delay
        (axios.put as jest.Mock).mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        data: {
                            access_token: 'new-token',
                            user_details: { id: 1, username: 'test' },
                        },
                    });
                }, 100);
            });
        });

        // Create an error object
        const error = {
            response: { status: 401 },
            config: { _retry: false, headers: {} },
        };

        // Mock apiClient to return a successful response
        const mockApiClientResponse = { data: 'success' };
        (apiClient as unknown as jest.Mock).mockResolvedValue(mockApiClientResponse);

        // Start the token refresh process
        const refreshPromise = responseErrorInterceptor(error);

        // Create another error object to test the queue
        const error2 = {
            response: { status: 401 },
            config: { _retry: false, headers: {} },
        };

        // Call the error response interceptor again while the first one is still processing
        const queuePromise = responseErrorInterceptor(error2);

        // Wait for both promises to resolve
        const results = await Promise.all([refreshPromise, queuePromise]);

        // Verify that axios.put was called only once
        expect(axios.put).toHaveBeenCalledTimes(1);

        // Verify that both promises resolved successfully
        expect(results[0]).toBe(mockApiClientResponse);
        expect(results[1]).toBe(mockApiClientResponse);
    });
});
