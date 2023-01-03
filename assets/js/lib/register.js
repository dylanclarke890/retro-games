class Register {
  static entity(classDef) {
    globalThis[classDef.name] = classDef;
  }

  static entities(...classDefs) {
    classDefs.forEach((classDef) => Register.entity(classDef));
  }
}
