export interface NuCloudConfig {
  api: {
    url: string;
    username: string;
    password: string;
  };
  producer?: {
    delay_seconds: number;
    template_path?: string;
  };
  profiles?: {
    [profileName: string]: Partial<NuCloudConfig>;
  };
}
