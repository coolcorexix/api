/* eslint-disable */
import {
  ApiPromise,
  WsProvider
} from "@polkadot/api/index";
import '@polkadot/api-augment';

import Keyring from "@polkadot/keyring";
import {
  TypeRegistry
} from "@polkadot/types/create/registry";
import {
  H256
} from "@polkadot/types/interfaces/index";
import {
  ISubmittableResult,
  Signer,
  SignerPayloadJSON,
  SignerResult
} from "@polkadot/types/types/extrinsic";


/**
 * Manages signing payloads with a set of pre-loaded accounts in a Keyring
 */
export class MonitzSigner implements Signer {
  private currentId = 0;
  private registry = new TypeRegistry();

  /**
   * @hidden
   */
  constructor(public readonly keyring: Keyring) {}

  /**
   * Sign a payload
   */
  public async signPayload(payload: SignerPayloadJSON): Promise < SignerResult > {
    const {
      keyring,
      registry
    } = this;
    const pair = keyring.getPair(payload.address);

    if (!pair) {
      throw new Error('The signer cannot sign transactions for the calling Account');
    }

    registry.setSignedExtensions(payload.signedExtensions);

    const signablePayload = registry.createType('ExtrinsicPayload', payload, {
      version: payload.version,
    });
    const {
      signature
    } = signablePayload.sign(pair);

    this.currentId += 1;

    console.log('SIGNATURE', signature);
    console.log('ID', this.currentId);

    return {
      signature,
      id: this.currentId,
    };
  }

  /**
   * @hidden
   */
  public update(id: number, receipt: ISubmittableResult | H256) {
    console.log('TX ID:', id);
    console.log('STATUS', receipt.toHuman());
    throw new Error("YOU WON'T SILENCE ME");
  }
}


async function main() {
  const wsProvider = new WsProvider("wss://rpc.polkadot.io");
  const api = await ApiPromise.create({
    provider: wsProvider
  });
  // Create a keyring instance
  const keyring = new Keyring({
    type: 'sr25519'
  });
  // Some mnemonic phrase
  const CALVARY_PHRASE = 'entire material egg meadow latin bargain dutch coral blood melt acoustic thought';
  const COOLCORE_ADDR = '15AgbRTVeEPo9jPt168CBXXjJhF1ABgfunz5eRSyv6xyq7SR';
  keyring.addFromUri(CALVARY_PHRASE);

  const monitzSigner = new MonitzSigner(keyring);
  const tx = await api.tx.balances
    .transfer(COOLCORE_ADDR, 12);
  const payload = api.createType('ExtrinsicPayload', {
      method: tx.toHex(),
      specVersion: api.runtimeVersion.specVersion,
      genesisHash: api.genesisHash,

  }, {
    version: 3,
  })
  const {signature} = await monitzSigner.signPayload(payload.toJSON());
  tx.addSignature(keyring.pairs[0].address, signature, payload.toHex());
}

main().then(() => console.log("finished"));
