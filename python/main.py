import sys
import json
import pandas as pd

from fetch_eligible import fetch_eligible_colleges
from ranking_engine import generate_personalized_rankings


def main():
    try:
        user_profile = json.loads(sys.argv[1])

        weights = json.loads(sys.argv[2])

        dataset_path = sys.argv[3]

        # -----------------------------------
        # FETCH ELIGIBLE COLLEGES
        # -----------------------------------

        eligible = fetch_eligible_colleges(
            dataset_path,
            user_profile
        )

        if eligible.empty:
            raise Exception("No eligible colleges found")

        # -----------------------------------
        # GENERATE RANKINGS
        # -----------------------------------

        result = generate_personalized_rankings(
            eligible,
            {
                "home_state": user_profile["home_state"]
            },
            weights
        )

        if result.empty:
            raise Exception("No ranking results generated")

        # -----------------------------------
        # CONVERT TO JSON
        # -----------------------------------

        final = result.fillna("").to_dict(orient="records")

        print(json.dumps(final))

        sys.exit(0)

    except Exception as e:
        print(str(e), file=sys.stderr)

        sys.exit(1)


if __name__ == "__main__":
    main()