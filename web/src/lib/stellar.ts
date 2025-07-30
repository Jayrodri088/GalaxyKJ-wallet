import { Keypair } from 'stellar-sdk';

export const generateKeypair = () => {
  const keypair = Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secret: keypair.secret(),
  };
};
