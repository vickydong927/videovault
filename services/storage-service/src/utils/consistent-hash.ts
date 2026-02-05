import crypto from 'crypto';

export interface StorageNode {
  id: string;
  capacity: number;
  endpoint: string;
  virtualNodes: number;
}

export class ConsistentHashRing {
  private ring: Map<number, string> = new Map();
  private nodes: Map<string, StorageNode> = new Map();
  private sortedKeys: number[] = [];
  private readonly virtualNodesPerNode = 150;

  addNode(node: StorageNode): void {
    this.nodes.set(node.id, node);
    
    // Add virtual nodes for better distribution
    const virtualNodes = node.virtualNodes || this.virtualNodesPerNode;
    for (let i = 0; i < virtualNodes; i++) {
      const virtualKey = `${node.id}:${i}`;
      const hash = this.hash(virtualKey);
      this.ring.set(hash, node.id);
    }
    
    this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }

  removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const virtualNodes = node.virtualNodes || this.virtualNodesPerNode;
    for (let i = 0; i < virtualNodes; i++) {
      const virtualKey = `${nodeId}:${i}`;
      const hash = this.hash(virtualKey);
      this.ring.delete(hash);
    }
    
    this.nodes.delete(nodeId);
    this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }

  getNode(key: string): string | null {
    if (this.sortedKeys.length === 0) return null;

    const hash = this.hash(key);
    
    // Binary search for the first node >= hash
    let left = 0;
    let right = this.sortedKeys.length - 1;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedKeys[mid] < hash) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    const nodeHash = this.sortedKeys[left >= this.sortedKeys.length ? 0 : left];
    return this.ring.get(nodeHash) || null;
  }

  getNodes(key: string, count: number): string[] {
    if (this.nodes.size === 0) return [];
    
    const result: string[] = [];
    const seen = new Set<string>();
    const hash = this.hash(key);
    
    let index = this.sortedKeys.findIndex(k => k >= hash);
    if (index === -1) index = 0;
    
    while (result.length < count && result.length < this.nodes.size) {
      const nodeHash = this.sortedKeys[index % this.sortedKeys.length];
      const nodeId = this.ring.get(nodeHash);
      
      if (nodeId && !seen.has(nodeId)) {
        result.push(nodeId);
        seen.add(nodeId);
      }
      
      index++;
    }
    
    return result;
  }

  getAllNodes(): StorageNode[] {
    return Array.from(this.nodes.values());
  }

  private hash(key: string): number {
    const hash = crypto.createHash('md5').update(key).digest();
    return hash.readUInt32BE(0);
  }
}