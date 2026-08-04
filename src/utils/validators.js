function isValidId(value) {
    if(typeof value === 'number') return Number.isInteger(value) && value > 0;
    if(typeof value === 'string') return /^[0-9]+$/.test(value) && parseInt(value, 10) > 0;
    return false;
}
module.exports = { isValidId };