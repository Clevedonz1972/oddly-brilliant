import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { ValidationError } from '../types';

/**
 * Blockchain Service - Handles blockchain interactions
 * This is a basic implementation - extend based on your specific blockchain needs
 */
export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;

  /**
   * Initialize blockchain provider
   * @param providerUrl - RPC provider URL (e.g., Infura, Alchemy)
   */
  initializeProvider(providerUrl: string): void {
    try {
      this.provider = new ethers.JsonRpcProvider(providerUrl);
      logger.info('Blockchain provider initialized');
    } catch (error) {
      logger.error('Failed to initialize blockchain provider:', error);
      throw new Error('Failed to connect to blockchain');
    }
  }

  /**
   * Get current provider
   * @returns Ethers provider
   */
  getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      throw new Error('Blockchain provider not initialized');
    }
    return this.provider;
  }

  /**
   * Get transaction details
   * @param txHash - Transaction hash
   * @returns Transaction receipt
   */
  async getTransaction(txHash: string): Promise<ethers.TransactionReceipt | null> {
    try {
      const provider = this.getProvider();
      const receipt = await provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      logger.error('Failed to get transaction:', error);
      throw new Error('Failed to retrieve transaction details');
    }
  }

  /**
   * Verify transaction exists and is confirmed
   * @param txHash - Transaction hash
   * @returns True if transaction is confirmed
   */
  async verifyTransaction(txHash: string): Promise<boolean> {
    try {
      const receipt = await this.getTransaction(txHash);

      if (!receipt) {
        return false;
      }

      // Check if transaction was successful (status === 1)
      return receipt.status === 1;
    } catch (error) {
      logger.error('Failed to verify transaction:', error);
      return false;
    }
  }

  /**
   * Get current block number
   * @returns Current block number
   */
  async getCurrentBlock(): Promise<number> {
    try {
      const provider = this.getProvider();
      return await provider.getBlockNumber();
    } catch (error) {
      logger.error('Failed to get current block:', error);
      throw new Error('Failed to retrieve current block number');
    }
  }

  /**
   * Estimate gas for a transaction
   * @param transaction - Transaction parameters
   * @returns Estimated gas
   */
  async estimateGas(transaction: ethers.TransactionRequest): Promise<bigint> {
    try {
      const provider = this.getProvider();
      return await provider.estimateGas(transaction);
    } catch (error) {
      logger.error('Failed to estimate gas:', error);
      throw new Error('Failed to estimate transaction gas');
    }
  }

  /**
   * Get current gas price
   * @returns Gas price in wei
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const provider = this.getProvider();
      const feeData = await provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      logger.error('Failed to get gas price:', error);
      throw new Error('Failed to retrieve gas price');
    }
  }

  /**
   * Validate transaction hash format
   * @param txHash - Transaction hash
   * @returns True if valid format
   */
  isValidTxHash(txHash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(txHash);
  }

  /**
   * Wait for transaction confirmation
   * @param txHash - Transaction hash
   * @param confirmations - Number of confirmations to wait for
   * @returns Transaction receipt
   */
  async waitForTransaction(
    txHash: string,
    confirmations = 1
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      if (!this.isValidTxHash(txHash)) {
        throw new ValidationError('Invalid transaction hash format');
      }

      const provider = this.getProvider();
      return await provider.waitForTransaction(txHash, confirmations);
    } catch (error) {
      logger.error('Failed to wait for transaction:', error);
      throw new Error('Transaction confirmation failed');
    }
  }
}

export const blockchainService = new BlockchainService();
