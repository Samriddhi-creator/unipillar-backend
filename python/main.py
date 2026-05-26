import sys
import json
import pandas as pd

from ranking_engine import generate_personalized_rankings

# =========================================
# READ INPUT
# =========================================

raw_input = sys.stdin.read()

print("INPUT RECEIVED", file=sys.stderr)

input_data = json.loads(raw_input)

# =========================================
# EXTRACT DATA
# =========================================

profile = input_data.get("profile", {})
weights = input_data.get("weights", {})
branches = input_data.get("branches", [])
dataset = input_data.get("dataset", [])

# =========================================
# DATAFRAME
# =========================================

df = pd.DataFrame(dataset)

print(df.columns.tolist(), file=sys.stderr)

# =========================================
# PROFILE NORMALIZATION
# =========================================

profile["ranks"] = {
    "main_crl": profile.get("mainCategoryRank", 0),
    "main_cat": profile.get("mainCategoryRank", 0),
    "adv_crl": profile.get("advCategoryRank", 0),
    "adv_cat": profile.get("advCategoryRank", 0)
}

profile["category"] = profile.get("category", "OPEN")
profile["gender"] = profile.get("gender", "Gender-Neutral")
profile["home_state"] = profile.get("homeState", "")

# =========================================
# RUN ENGINE
# =========================================

result = generate_personalized_rankings(
    df,
    {
        "branches": branches,
        "home_state": profile["homeState"]
    },
    {
        "branch": weights["branch"],
        "prestige": weights["college"],
        "location": weights["hometown"]
    },
    profile["mainCategoryRank"]
)

# =========================================
# OUTPUT JSON
# =========================================

print(result.to_json(orient="records"))