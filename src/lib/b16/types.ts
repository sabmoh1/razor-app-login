
export interface Row {
  id: string;
  rate: string;
  seq: string;
}

export interface Platform {
  id: string;
  name: string;
  logo: string;
}

export interface ApiKey {
  id: string;
  key: string;
  uses: number;
  attempts: number;
}
