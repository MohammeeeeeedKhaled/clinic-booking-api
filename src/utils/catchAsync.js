/**
 * @desc    Wrapper function to eliminate try-catch blocks in async controllers
 * @param   {Function} fn - The asynchronous controller function to wrap
 * @returns {Function} A new middleware function that catches any unhandled promise rejections
 */
module.exports = (fn) => {
    return (req, res, next) => {
        // Execute the async function and append .catch() to forward any errors to the Global Error Handler
        fn(req, res, next).catch(next);
    };
};