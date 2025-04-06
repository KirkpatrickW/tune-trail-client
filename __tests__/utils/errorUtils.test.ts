import { parseBackendError } from '../../src/utils/errorUtils';

describe('parseBackendError', () => {
    it('should parse array of validation errors correctly', () => {
        const errorDetails = [
            { loc: ['user', 'email'], msg: 'Invalid email format' },
            { loc: ['password'], msg: 'Password is too short' }
        ];

        const result = parseBackendError(errorDetails);

        expect(result).toEqual([
            'Email invalid email format.',
            'Password password is too short.'
        ]);
    });

    it('should handle single string error', () => {
        const errorDetails = 'Invalid credentials';

        const result = parseBackendError(errorDetails);

        expect(result).toEqual(['Invalid credentials']);
    });

    it('should handle unknown error type with default message', () => {
        const errorDetails = { some: 'object' };

        const result = parseBackendError(errorDetails);

        expect(result).toEqual(['An unexpected error occurred. Please try again.']);
    });

    it('should handle empty array', () => {
        const errorDetails: any[] = [];

        const result = parseBackendError(errorDetails);

        expect(result).toEqual([]);
    });

    it('should handle null and undefined', () => {
        expect(parseBackendError(null)).toEqual(['An unexpected error occurred. Please try again.']);
        expect(parseBackendError(undefined)).toEqual(['An unexpected error occurred. Please try again.']);
    });

    it('should properly format field names with underscores', () => {
        const errorDetails = [
            { loc: ['user_profile', 'phone_number'], msg: 'Invalid format' }
        ];

        const result = parseBackendError(errorDetails);

        expect(result).toEqual(['Phone number invalid format.']);
    });
}); 