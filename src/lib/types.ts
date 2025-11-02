export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  reorderLevel: number;
  price: number;
  category: string;
  supplier: string;
  imageUrl: string;
  lastUpdated: string;
};

export type VoiceCommandResponse = {
  success: boolean;
  message: string;
  action?: 'REFRESH_DASHBOARD' | 'REFRESH_INVENTORY' | 'OPEN_ADD_ITEM_DIALOG' | null;
  data?: any;
};
