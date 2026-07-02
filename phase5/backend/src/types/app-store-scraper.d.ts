declare module "app-store-scraper" {
  interface Review {
    id: string;
    title: string;
    text: string;
    score: number;
    userName: string;
    updated: string;
  }

  const store: {
    reviews: (opts: {
      id: number | string;
      country: string;
      page: number;
      sort: any;
    }) => Promise<any[]>;
    sort: {
      RECENT: any;
    };
  };

  export default store;
}
