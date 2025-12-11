import crypto from 'crypto';

const passwordGenerator = (length = 12) => {
    // Aseguramos al menos una mayúscula, una minúscula y un número
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const specials = '!@#$%&*().';
    const all = upper + lower + digits + specials;

    if (length < 4) length = 4; // garantizar espacio para los grupos obligatorios

    // Elegir al menos un carácter de cada grupo obligatorio
    const required = [
        upper[crypto.randomInt(0, upper.length)],
        lower[crypto.randomInt(0, lower.length)],
        digits[crypto.randomInt(0, digits.length)],
    ];

    // Rellenar el resto con caracteres aleatorios de `all`
    for (let i = required.length; i < length; i++) {
        required.push(all[crypto.randomInt(0, all.length)]);
    }

    // Mezclar el array `required` para evitar que los caracteres obligatorios queden siempre al inicio
    for (let i = required.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        const tmp = required[i];
        required[i] = required[j];
        required[j] = tmp;
    }

    return required.join('');
};

// Alias para mantener compatibilidad con `passwordGeneratorbyAdmin`
const passwordGeneratorbyAdmin = () => passwordGenerator();

export {
    passwordGenerator,
    passwordGeneratorbyAdmin
};