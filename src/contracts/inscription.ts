import { OrdiMethodCallOptions, OrdinalNFT } from "scrypt-ord";
import { Addr, method, assert, prop, ByteString } from "scrypt-ts";

export class Register extends OrdinalNFT {
  @prop()
  propNumber: ByteString;
  @prop()
  propSize: ByteString;
  @prop()
  propAddress: ByteString;
  @prop()
  geoLocation: ByteString;
  constructor(
    propNumber: ByteString,
    propSize: ByteString,
    propAddress: ByteString,
    geolocation: ByteString
  ) {
    super();
    this.init(...arguments);
    this.propNumber = propNumber;
    this.propSize = propSize;
    this.propAddress = propAddress;
    this.geoLocation = geolocation;
  }
  @method()
  public transfer(address: Addr) {
    assert(true);
  }
}
