export const parseBackendError = (errorDetails: unknown): string[] => {
    if (Array.isArray(errorDetails)) {
        return errorDetails.map((err: { loc: string[]; msg: string }) => {
            const field = err.loc[err.loc.length - 1];
            const prettifiedField = field
                .replace(/_/g, ' ')
                .replace(/^\w/, (char) => char.toUpperCase());
            const decapitalizedMsg = err.msg.charAt(0).toLowerCase() + err.msg.slice(1);
            return `${prettifiedField} ${decapitalizedMsg}.`;
        });
    } else if (typeof errorDetails === 'string') {
        return [errorDetails];
    }
    return ['An unexpected error occurred. Please try again.'];
};