export class VendorAttributes {
  static set(element, attribute, value) {
    const uc = attribute.charAt(0).toUpperCase() + attribute.substr(1); // for camel casing.
    element[attribute] =
      element["ms" + uc] =
      element["moz" + uc] =
      element["webkit" + uc] =
      element["o" + uc] =
        value;
  }

  static get(element, attribute) {
    const uc = attribute.charAt(0).toUpperCase() + attribute.substr(1); // for camel casing.
    return (
      element[attribute] ||
      element["ms" + uc] ||
      element["moz" + uc] ||
      element["webkit" + uc] ||
      element["o" + uc]
    );
  }

  static normalize(element, attribute) {
    const prefixedVal = VendorAttributes.get(element, attribute);
    if (!element[attribute] && prefixedVal) element[attribute] = prefixedVal;
  }
}
