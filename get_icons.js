const lr = require('lucide-react');
const icons = Object.keys(lr).filter(k => {
  // Only icon components (start with uppercase, not a utility/type)
  return /^[A-Z]/.test(k) && typeof lr[k] === 'object' && k !== 'icons' && k !== 'default' && !k.endsWith('Icon');
});
console.log(JSON.stringify(icons));
console.log('TOTAL:', icons.length);
