import crypto from 'crypto';

const passwordGenerator = (length = 12) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*().';
    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, charset.length);
        password += charset[randomIndex];
    }

    return password;
};

// Alias para mantener compatibilidad con `passwordGeneratorbyAdmin`
const passwordGeneratorbyAdmin = () => passwordGenerator();

export {
    passwordGenerator,
    passwordGeneratorbyAdmin
};