// TypeScript bridge with feature-flag fallback
let native: any;
try {
  native = require("../../rust/bizra_node/index.js");
} catch {
  native = {};
}

export const finalizeBlock = (hash: Uint8Array) =>
  native.finalize_block ? native.finalize_block(Buffer.from(hash)) : true; // Day-1 no-op fallback

export const verifyBlock = (bytes: Uint8Array) =>
  native.verify_block ? native.verify_block(Buffer.from(bytes)) : true;

export const verifyAttestation = (
  msg: Uint8Array,
  pk: Uint8Array,
  sig: Uint8Array,
) =>
  native.verify_attestation
    ? native.verify_attestation(
        Buffer.from(msg),
        Buffer.from(pk),
        Buffer.from(sig),
      )
    : false;

export const generateAttestationPlaceholder = (msg: Uint8Array) =>
  native.generate_attestation_placeholder
    ? native.generate_attestation_placeholder(Buffer.from(msg))
    : new Uint8Array(64);
