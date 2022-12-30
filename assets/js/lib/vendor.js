class Vendor {
  static setAttribute(element, attribute, value) {
    const uc = attribute.charAt(0).toUpperCase() + attribute.substr(1); // for camel casing.
    element[attribute] =
      element["ms" + uc] =
      element["moz" + uc] =
      element["webkit" + uc] =
      element["o" + uc] =
        value;
  }

  static getAttribute(element, attribute) {
    const uc = attribute.charAt(0).toUpperCase() + attribute.substr(1); // for camel casing.
    return (
      element[attribute] ||
      element["ms" + uc] ||
      element["moz" + uc] ||
      element["webkit" + uc] ||
      element["o" + uc]
    );
  }

  static normalizeAttribute(element, attribute) {
    const prefixedVal = Vendor.getAttribute(element, attribute);
    if (!element[attribute] && prefixedVal) element[attribute] = prefixedVal;
  }
}
