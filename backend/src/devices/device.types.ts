export type Device = {
  createdAt: string;
  deviceApiKey: string;
  deviceId: string;
  enabled: boolean;
  name: string;
  updatedAt: string;
};

export type PublicDevice = Omit<Device, 'deviceApiKey'>;
