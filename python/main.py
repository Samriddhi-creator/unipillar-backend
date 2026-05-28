import sys
import json
import pandas as pd

from ranking_engine import generate_personalized_rankings

# =========================================
# READ INPUT
# =========================================
raw_input = sys.stdin.read()
input_data = json.loads(raw_input)

# =========================================
# EXTRACT DATA
# =========================================
profile = input_data.get("profile", {})
weights = input_data.get("weights", {})
branches = input_data.get("branches", [])
dataset = input_data.get("dataset", [])

df = pd.DataFrame(dataset)

# =========================================
# PROFILE NORMALIZATION (FIXED)
# =========================================
category_rank = profile.get("mainCategoryRank", 0)

# safer rank handling (important fix)
if category_rank is None:
    category_rank = 0

# =========================================
# USER PREFERENCES (FIXED KEY CONSISTENCY)
# =========================================
user_preferences = {
    "branches": branches,
    "home_state": profile.get("homeState", "")
}

# =========================================
# WEIGHTS SAFETY CHECK (IMPORTANT)
# =========================================
budget_weights = {
    "branch": weights.get("branch", 34),
    "prestige": weights.get("college", 33),
    "location": weights.get("hometown", 33)
}

# =========================================
# RUN ENGINE
# =========================================
result = generate_personalized_rankings(
    df,
    user_preferences,
    budget_weights,
    category_rank   # FIXED (clean rank input)
)

# =========================================
# OUTPUT
# =========================================
print(result.to_json(orient="records"))