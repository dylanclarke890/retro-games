export const mix = (superclass) => new MixinBuilder(superclass);

class MixinBuilder {
  constructor(superclass) {
    this.superclass = superclass;
  }

  with(...mixins) {
    return mixins.reduce((c, mixin) => mixin(c), this.superclass);
  }
}

class Base {
  do() {
    console.log("Doing");
  }
}

class Test extends mix(Base).with() {
  do() {
    super.do();
    console.log("Also Doing");
  }
}

new Test().do();