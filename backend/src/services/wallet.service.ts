import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { ValidationError } from '../types';

/**
 * Wallet Service - Handles Ethereum wallet operations
 */
export class WalletService {
  /**
   * Validate Ethereum address format
   * @param address - Ethereum address to validate
   * @returns True if valid
   */
  isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch (_error) {
      return false;
    }
  }

  /**
   * Verify signature for wallet authentication
   * @param message - Original message that was signed
   * @param signature - Signature to verify
   * @param expectedAddress - Expected signer address
   * @returns True if signature is valid
   */
  verifySignature(message: string, signature: string, expectedAddress: string): boolean {
    try {
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);

      // Compare recovered address with expected address (case-insensitive)
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate a nonce message for wallet signing
   * @param address - Wallet address
   * @param nonce - Random nonce
   * @returns Message to be signed
   */
  generateNonceMessage(address: string, nonce: string): string {
    return `Sign this message to authenticate your wallet:\n\nAddress: ${address}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
  }

  /**
   * Validate and checksum Ethereum address
   * @param address - Ethereum address
   * @returns Checksummed address
   */
  checksumAddress(address: string): string {
    if (!this.isValidAddress(address)) {
      throw new ValidationError('Invalid Ethereum address');
    }

    return ethers.getAddress(address);
  }

  /**
   * Get balance of an Ethereum address
   * @param address - Ethereum address
   * @param providerUrl - RPC provider URL
   * @returns Balance in ETH
   */
  async getBalance(address: string, providerUrl: string): Promise<string> {
    try {
      if (!this.isValidAddress(address)) {
        throw new ValidationError('Invalid Ethereum address');
      }

      const provider = new ethers.JsonRpcProvider(providerUrl);
      const balance = await provider.getBalance(address);

      // Convert from wei to ETH
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw new Error('Failed to retrieve wallet balance');
    }
  }

  /**
   * Format Wei to Ether
   * @param wei - Wei amount as string
   * @returns Ether amount as string
   */
  formatEther(wei: string): string {
    return ethers.formatEther(wei);
  }

  /**
   * Parse Ether to Wei
   * @param ether - Ether amount as string
   * @returns Wei amount as string
   */
  parseEther(ether: string): string {
    return ethers.parseEther(ether).toString();
  }
}

export const walletService = new WalletService();
