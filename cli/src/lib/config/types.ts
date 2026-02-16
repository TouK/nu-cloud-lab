export interface NuCloudConfig {
  api: {
    url: string;
    username: string;
    password: string;
  };
  producer?: {
    delay_seconds: number;
  };
  profiles?: {
    [profileName: string]: Partial<NuCloudConfig>;
  };
}
