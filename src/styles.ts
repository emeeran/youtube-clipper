/**
 * UI styling constants to eliminate DRY violations
 */

export const MODAL_STYLES = {
    zIndex: '10000',
    display: 'flex',
    header: {
        marginBottom: '15px',
        color: 'var(--text-accent)'
    },
    message: {
        marginBottom: '20px',
        lineHeight: '1.5'
    },
    buttonContainer: {
        marginTop: '20px',
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end'
    },
    button: {
        padding: '8px 16px',
        minWidth: '100px'
    }
} as const;

export const INPUT_STYLES = {
    width: '100%',
    marginTop: '8px',
    padding: '8px',
    border: '1px solid var(--background-modifier-border)',
    borderRadius: '4px'
} as const;

export const CONTAINER_STYLES = {
    marginTop: '20px'
} as const;
