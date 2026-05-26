export class GeneratePreferencesDto {
  profile: {
    mainCategoryRank: number;
    advCategoryRank: number;
    category: string;
    homeState: string;
    gender: string;
  };

  weights: {
    hometown: number;
    college: number;
    branch: number;
  };

  branches: string[];
}