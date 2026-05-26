import sys
import json
import pandas as pd


# =========================
# HELPERS
# =========================

def normalize_text(value):
    return (
        str(value)
        .lower()
        .replace(",", "")
        .strip()
    )


# =========================
# PROBABILITY LOGIC
# =========================

def calculate_probability(user_rank, closing_rank):

    try:
        user_rank = float(user_rank)
        closing_rank = float(closing_rank)

    except:
        return 0.0

    if closing_rank <= 0:
        return 0.0

    # =========================
    # REALISTIC PROBABILITY
    # =========================

    if user_rank <= closing_rank * 0.70:
        return 99.0

    elif user_rank <= closing_rank * 0.90:
        return 85.0

    elif user_rank <= closing_rank:
        return 65.0

    elif user_rank <= closing_rank * 1.10:
        return 40.0

    else:
        return 10.0


# =========================
# MASTER PREDICTION ENGINE
# =========================

def generate_master_predictions(
    df,
    user_rank,
    category,
    gender,
    home_state,
    exam_type
):

    # =========================
    # NORMALIZATION
    # =========================

    exam = str(exam_type).lower().strip()
    gender = str(gender).lower().strip()
    category = str(category).lower().strip()
    home_state = str(home_state).lower().strip()

    # =========================
    # STRING CLEANING
    # =========================

    string_cols = [
        'Institute',
        'branch_shortcut',
        'degree_type',
        'Gender',
        'Quota',
        'college_state',
        'Category',
        'institute_type'
    ]

    for col in string_cols:

        if col in df.columns:

            df[col] = (
                df[col]
                .astype(str)
                .str.strip()
            )

    # =========================
    # CATEGORY NORMALIZATION
    # =========================

    df['Category_lower'] = (
        df['Category']
        .astype(str)
        .str.lower()
        .str.strip()
    )

    df['Gender_lower'] = (
        df['Gender']
        .astype(str)
        .str.lower()
        .str.strip()
    )

    # =========================
    # EXAM FILTER
    # =========================

    if exam in ['jee advanced', 'jee adv']:

        allowed = ["IIT"]

    else:

        allowed = ["NIT", "IIIT", "GFTI"]

    filtered_df = df[
        df["institute_type"].isin(allowed)
    ].copy()

    # =========================
    # QUOTA FILTER
    # =========================

    if exam not in ['jee advanced', 'jee adv']:

        is_home_state = (
            filtered_df['college_state']
            .str.lower()
            == home_state
        )

        filtered_df = filtered_df[
            (
                (filtered_df['Quota'] == 'HS')
                & is_home_state
            )
            |
            (
                (filtered_df['Quota'] == 'OS')
                & (~is_home_state)
            )
            |
            (
                filtered_df['Quota'] == 'AI'
            )
        ]

    # =========================
    # GENDER FILTER
    # =========================

    if gender.startswith('female'):

        filtered_df = filtered_df[
            filtered_df['Gender_lower']
            .isin([
                'female-only',
                'female-only (including supernumerary)'
            ])
        ]

    else:

        filtered_df = filtered_df[
            filtered_df['Gender_lower']
            .str.contains(
                'gender-neutral',
                na=False
            )
        ]

    # =========================
    # CATEGORY SEARCH
    # =========================

    search_cats = [category]

    if category in ['open', 'general', 'gen']:

        search_cats += ['general']

    elif category in ['open (pwd)', 'general (pwd)']:

        search_cats += ['general (pwd)']

    elif category in ['ews', 'gen-ews']:

        search_cats += ['gen-ews']

    elif category in ['ews (pwd)', 'gen-ews (pwd)']:

        search_cats += ['gen-ews (pwd)']

    elif category in ['obc', 'obc-ncl']:

        search_cats += ['obc']

    elif category in ['obc (pwd)', 'obc-ncl (pwd)']:

        search_cats += ['obc (pwd)']

    # =========================
    # FILTER CATEGORY
    # =========================

    filtered_df = filtered_df[
        filtered_df['Category_lower']
        .isin(search_cats)
    ]

    # =========================
    # PREDICTIONS
    # =========================

    predictions = []

    for _, row in filtered_df.iterrows():

        try:

            closing_rank = float(
                row['predicted_closing_rank_2026']
            )

            prob = calculate_probability(
                user_rank,
                closing_rank
            )

            predictions.append({

                'Institute': row['Institute'],

                'Branch': row['branch_shortcut'],

                'Degree': row['degree_type'],

                'Quota': row['Quota'],

                'Gender': row['Gender'],

                'Category': row['Category'],

                '2026_Cutoff': int(closing_rank),

                'Probability_%': prob,

                'Global_Prestige_Index':
                    row.get(
                        'Global_Prestige_Index',
                        0
                    ),

                'Global_Branch_Popularity':
                    row.get(
                        'Global_Branch_Popularity',
                        0
                    )
            })

        except:
            continue

    if not predictions:
        return pd.DataFrame()

    res_df = pd.DataFrame(predictions)

    # =========================
    # REMOVE DUPLICATES
    # KEEP BEST PROBABILITY
    # =========================

    res_df = (
        res_df
        .sort_values(
            by='Probability_%',
            ascending=False
        )
        .drop_duplicates(
            subset=[
                'Institute',
                'Branch',
                'Degree'
            ]
        )
    )

    return res_df


# =========================
# FRONTEND DASHBOARD DATA
# =========================

def get_josaa_dashboard_data(
    master_df,
    target_college,
    target_branch
):

    if master_df.empty:

        return {
            "status": "success",
            "message": "No favorable matches found for this profile.",
            "data": {
                "targeted_match": [],
                "institute_based_results": {
                    "high_prob": [],
                    "mod_prob": [],
                    "low_prob": []
                },
                "branch_based_results": {
                    "high_prob": [],
                    "mod_prob": [],
                    "low_prob": []
                }
            }
        }

    # =========================
    # NORMALIZED MATCHING
    # =========================

    normalized_target_college = normalize_text(
        target_college
    )

    normalized_target_branch = normalize_text(
        target_branch
    )

    mask_college = (
        master_df['Institute']
        .astype(str)
        .apply(normalize_text)
        ==
        normalized_target_college
    )

    mask_branch = (
        master_df['Branch']
        .astype(str)
        .apply(normalize_text)
        ==
        normalized_target_branch
    )

    targeted_match = master_df[
        mask_college & mask_branch
    ]

    institute_based = master_df[
        mask_college
    ]

    branch_based = master_df[
        mask_branch
    ]

    # =========================
    # FORMATTER
    # =========================

    def format_for_frontend(df):

        if df.empty:
            return []

        ui_df = df.copy()

        ui_df['Admit_Odds_Display'] = (
            ui_df['Probability_%']
            .astype(str)
            + "%"
        )

        return ui_df.to_dict(
            orient='records'
        )

    # =========================
    # LIMIT RESULTS
    # =========================

    high_inst = institute_based[
        institute_based['Probability_%'] >= 75
    ].head(10)

    mod_inst = institute_based[
        (
            institute_based['Probability_%'] >= 40
        )
        &
        (
            institute_based['Probability_%'] < 75
        )
    ].head(10)

    low_inst = institute_based[
        institute_based['Probability_%'] < 40
    ].head(10)

    high_branch = branch_based[
        branch_based['Probability_%'] >= 75
    ].head(10)

    mod_branch = branch_based[
        (
            branch_based['Probability_%'] >= 40
        )
        &
        (
            branch_based['Probability_%'] < 75
        )
    ].head(10)

    low_branch = branch_based[
        branch_based['Probability_%'] < 40
    ].head(10)

    return {

        "status": "success",

        "data": {

            "targeted_match":
                format_for_frontend(
                    targeted_match
                ),

            "institute_based_results": {

                "high_prob":
                    format_for_frontend(
                        high_inst
                    ),

                "mod_prob":
                    format_for_frontend(
                        mod_inst
                    ),

                "low_prob":
                    format_for_frontend(
                        low_inst
                    )
            },

            "branch_based_results": {

                "high_prob":
                    format_for_frontend(
                        high_branch
                    ),

                "mod_prob":
                    format_for_frontend(
                        mod_branch
                    ),

                "low_prob":
                    format_for_frontend(
                        low_branch
                    )
            }
        }
    }


# =========================
# ENTRY POINT
# =========================

if __name__ == "__main__":

    raw = sys.stdin.read()

    if not raw.strip():

        print(json.dumps({
            "error": "No input received"
        }))

        sys.exit(1)

    input_data = json.loads(raw)

    # =========================
    # DATASET
    # =========================

    df = pd.DataFrame(
        input_data["dataset"]
    )

    # =========================
    # COLUMN NORMALIZATION
    # =========================

    df.rename(
        columns={
            'Seat Type': 'Category'
        },
        inplace=True
    )

    # =========================
    # USER PAYLOAD
    # =========================

    user = input_data["user"]

    # =========================
    # RUN PIPELINE
    # =========================

    master_df = generate_master_predictions(

        df=df,

        user_rank=user["user_rank"],

        category=user["category"],

        gender=user["gender"],

        home_state=user["home_state"],

        exam_type=user["exam_type"]
    )

    final_json = get_josaa_dashboard_data(

        master_df=master_df,

        target_college=user["target_college"],

        target_branch=user["target_branch"]
    )

    print(
        json.dumps(final_json)
    )