/**
 * Form Validation Utility for Prop's Room
 * Centralized regex patterns and validation functions
 */

// Regex patterns for form validation
export const PATTERNS = {
  // Email: standard format
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,

  // Password: min 8 chars, at least 1 letter and 1 number
  password: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,

  // Phone (Mexico): +52 or local format
  phone: /^(\+?52)?[\s-]?\(?\d{2,3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,

  // Name: letters, accents, spaces, hyphens, apostrophes (2-50 chars)
  name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,50}$/,

  // Postal Code (Mexico): exactly 5 digits
  postalCode: /^\d{5}$/,

  // Street Address: alphanumeric with common symbols
  address: /^[\w\s,.'#/\-áéíóúÁÉÍÓÚñÑ]{5,150}$/,

  // City/State: letters and accents
  cityState: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,50}$/,

  // SKU: uppercase letters, numbers, hyphens
  sku: /^[A-Z0-9-]{3,20}$/,

  // Coupon code: uppercase alphanumeric
  couponCode: /^[A-Z0-9]{4,20}$/,

  // Positive number (price, stock) - accepts: 0, 1, 99, .50, 0.50, 99.99
  positiveNumber: /^(0|[1-9]\d*)(\.\d{1,2})?$|^\.\d{1,2}$/,

  // Product name: 2-100 chars
  productName: /^[\w\s,.'&\-áéíóúÁÉÍÓÚñÑ]{2,100}$/,
};

// Error messages in Spanish
export const ERROR_MESSAGES = {
  required: "Este campo es requerido",
  email: "Ingresa un correo electrónico válido",
  password:
    "La contraseña debe tener al menos 8 caracteres, una letra y un número",
  passwordMatch: "Las contraseñas no coinciden",
  phone: "Ingresa un número de teléfono válido (ej: +52 55 1234 5678)",
  name: "Ingresa un nombre válido (solo letras, 2-50 caracteres)",
  postalCode: "El código postal debe tener 5 dígitos",
  address: "Ingresa una dirección válida (mínimo 5 caracteres)",
  cityState: "Ingresa un nombre de ciudad/estado válido",
  sku: "El SKU debe tener 3-20 caracteres (letras mayúsculas, números, guiones)",
  couponCode:
    "El código debe tener 4-20 caracteres alfanuméricos en mayúsculas",
  positiveNumber: "Ingresa un número válido mayor a 0",
  productName: "El nombre debe tener 2-100 caracteres",
};

/**
 * Validate a single field
 * @param {string} value - The value to validate
 * @param {string} type - The type of validation (email, password, phone, etc.)
 * @param {object} options - Additional options { required: boolean }
 * @returns {{ isValid: boolean, error: string | null }}
 */
export const validateField = (value, type, options = { required: true }) => {
  // Check for empty/null values
  const trimmedValue = value?.toString().trim() || "";

  if (options.required && !trimmedValue) {
    return { isValid: false, error: ERROR_MESSAGES.required };
  }

  // If not required and empty, it's valid
  if (!options.required && !trimmedValue) {
    return { isValid: true, error: null };
  }

  // Get the pattern for this type
  const pattern = PATTERNS[type];

  if (!pattern) {
    console.warn(`No validation pattern found for type: ${type}`);
    return { isValid: true, error: null };
  }

  const isValid = pattern.test(trimmedValue);

  return {
    isValid,
    error: isValid ? null : ERROR_MESSAGES[type] || "Valor inválido",
  };
};

/**
 * Validate an entire form
 * @param {object} formData - The form data object
 * @param {object} schema - Schema defining field types { fieldName: { type: string, required: boolean } }
 * @returns {{ isValid: boolean, errors: object }}
 */
export const validateForm = (formData, schema) => {
  const errors = {};
  let isValid = true;

  Object.keys(schema).forEach((fieldName) => {
    const { type, required = true } = schema[fieldName];
    const value = formData[fieldName];
    const result = validateField(value, type, { required });

    if (!result.isValid) {
      isValid = false;
      errors[fieldName] = result.error;
    }
  });

  return { isValid, errors };
};

/**
 * Custom validation for password confirmation
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {{ isValid: boolean, error: string | null }}
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return { isValid: false, error: ERROR_MESSAGES.passwordMatch };
  }
  return { isValid: true, error: null };
};

/**
 * Hook-friendly validation state manager
 * Returns initial empty errors object for a given schema
 */
export const createErrorState = (schema) => {
  const errors = {};
  Object.keys(schema).forEach((key) => {
    errors[key] = null;
  });
  return errors;
};

// Validation schemas for common forms
export const FORM_SCHEMAS = {
  login: {
    email: { type: "email", required: true },
    password: { type: "password", required: true },
  },
  register: {
    firstName: { type: "name", required: true },
    lastName: { type: "name", required: true },
    email: { type: "email", required: true },
    phone: { type: "phone", required: false },
    password: { type: "password", required: true },
  },
  profile: {
    firstName: { type: "name", required: true },
    lastName: { type: "name", required: true },
    phone: { type: "phone", required: false },
  },
  address: {
    street: { type: "address", required: true },
    city: { type: "cityState", required: true },
    state: { type: "cityState", required: true },
    postalCode: { type: "postalCode", required: true },
  },
  checkout: {
    email: { type: "email", required: true },
    phone: { type: "phone", required: true },
    firstName: { type: "name", required: true },
    lastName: { type: "name", required: true },
    address: { type: "address", required: true },
    city: { type: "cityState", required: true },
    state: { type: "cityState", required: true },
    postalCode: { type: "postalCode", required: true },
  },
  product: {
    name: { type: "productName", required: true },
    basePrice: { type: "positiveNumber", required: true },
    stock: { type: "positiveNumber", required: true },
  },
  coupon: {
    code: { type: "couponCode", required: true },
    discountValue: { type: "positiveNumber", required: true },
  },
};

export default {
  PATTERNS,
  ERROR_MESSAGES,
  FORM_SCHEMAS,
  validateField,
  validateForm,
  validatePasswordMatch,
  createErrorState,
};
