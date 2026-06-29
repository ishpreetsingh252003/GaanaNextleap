declare module "app-store-scraper" {
  interface ReviewOptions {
    id: number;
    country?: string;
    page?: number;
    sort?: number;
  }

  interface AppReview {
    id: string;
    userName: string;
    userUrl: string;
    version: string;
    score: number;
    title: string;
    text: string;
    url: string;
    updated: string;
  }

  const sort: { RECENT: number; HELPFUL: number };

  function reviews(opts: ReviewOptions): Promise<AppReview[]>;

  export = { reviews, sort };
}
