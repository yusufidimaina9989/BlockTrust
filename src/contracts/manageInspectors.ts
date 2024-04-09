import {
  method,
  prop,
  SmartContract,
  hash256,
  assert,
  ByteString,
  FixedArray,
  toByteString,
  fill,
  PubKey,
} from "scrypt-ts";

export type Inspector = {
  name: ByteString;
  pubkey: ByteString;
  address: ByteString;
  isRemoved: boolean;
};

export class ManageInspectors extends SmartContract {
  static readonly MAX_INSPECTORS = 20;

  @prop(true)
  inspectors: FixedArray<Inspector, typeof ManageInspectors.MAX_INSPECTORS>;

  constructor() {
    super(...arguments);
    this.inspectors = fill(
      {
        name: toByteString(""),
        pubkey: toByteString("00"),
        address: toByteString(""),
        isRemoved: true,
      },
      ManageInspectors.MAX_INSPECTORS
    );
  }

  @method()
  public addInspector(inspector: Inspector, inspectorIdx: bigint) {
    assert(this.inspectors[Number(inspectorIdx)].isRemoved, " slot not empty");

    assert(inspector.name != toByteString(""), " should not be empty");

    this.inspectors[Number(inspectorIdx)] = inspector;

    let outputs = this.buildStateOutput(this.ctx.utxo.value);
    outputs += this.buildChangeOutput();
    assert(hash256(outputs) == this.ctx.hashOutputs, "hashOutputs mismatch");
  }

  @method()
  public inspectorRemoved(inspectorIdx: bigint) {
    const inspector = this.inspectors[Number(inspectorIdx)];

    this.inspectors[Number(inspectorIdx)].isRemoved = true;

    let outputs = this.buildStateOutput(this.ctx.utxo.value);
    outputs += this.buildChangeOutput();
    assert(hash256(outputs) == this.ctx.hashOutputs, "hashOutputs mismatch");
  }
}
