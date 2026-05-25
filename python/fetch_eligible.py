# =========================================================
# FILE 1: fetch_eligible.py
# =========================================================

import pandas as pd
import numpy as np


def build_valid_categories(category, pwd):

    category = str(category).strip().upper()

    if not pwd:
        return [category]

    mapping = {
        "OPEN": [
            "OPEN",
            "OPEN (PWD)"
        ],

        "EWS": [
            "EWS",
            "EWS (PWD)"
        ],

        "OBC-NCL": [
            "OBC-NCL",
            "OBC-NCL (PWD)"
        ],

        "SC": [
            "SC",
            "SC (PWD)"
        ],

        "ST": [
            "ST",
            "ST (PWD)"
        ]
    }

    return mapping.get(category, [category])


def fetch_eligible_colleges(db_path, user_profile):
    """
    Fetches ALL eligible colleges using JoSAA-style filtering.

    Supports:
    - Category
    - PwD
    - Gender
    - Home State quota
    - IIT / Non-IIT separation
    """

    # -----------------------------------------------------
    # LOAD DATA
    # -----------------------------------------------------

    df = pd.read_csv(db_path)

    # -----------------------------------------------------
    # USER DATA
    # -----------------------------------------------------

    category = str(
        user_profile['category']
    ).strip().upper()

    gender = str(
        user_profile['gender']
    ).strip().upper()

    home_state = str(
        user_profile['home_state']
    ).strip().upper()

    pwd = user_profile.get("pwd", False)

    ranks = user_profile['ranks']

    valid_categories = build_valid_categories(
        category,
        pwd
    )

    # -----------------------------------------------------
    # CLEAN DATA
    # -----------------------------------------------------

    df['clean_category'] = (
        df['Seat Type']
        .astype(str)
        .str.strip()
        .str.upper()
    )

    df['clean_gender'] = (
        df['Gender']
        .astype(str)
        .str.strip()
        .str.upper()
    )

    df['clean_state'] = (
        df['college_state']
        .astype(str)
        .str.strip()
        .str.upper()
    )

    df['clean_quota'] = (
        df['Quota']
        .astype(str)
        .str.strip()
        .str.upper()
    )

    # -----------------------------------------------------
    # FILTER GENDER
    # -----------------------------------------------------

    if gender == 'GENDER-NEUTRAL':

        df = df[
            df['clean_gender']
            .str.contains(
                'GENDER-NEUTRAL',
                na=False
            )
        ].copy()

    else:

        df = df[
            (
                df['clean_gender']
                .str.contains(
                    'GENDER-NEUTRAL',
                    na=False
                )
            )
            |
            (
                df['clean_gender']
                .str.contains(
                    'FEMALE',
                    na=False
                )
            )
        ].copy()

    # -----------------------------------------------------
    # HOME STATE LOGIC
    # -----------------------------------------------------

    is_home_state = (
        df['clean_state'] == home_state
    )

    valid_quotas = (
        (df['clean_quota'] == 'AI')

        |

        (
            (df['clean_quota'] == 'HS')
            &
            is_home_state
        )

        |

        (
            (df['clean_quota'] == 'OS')
            &
            ~is_home_state
        )
    )

    df = df[valid_quotas].copy()

    # -----------------------------------------------------
    # SEPARATE IIT / NON-IIT
    # -----------------------------------------------------

    iit_df = df[
        df['institute_type'] == 'IIT'
    ].copy()

    non_iit_df = df[
        df['institute_type'] != 'IIT'
    ].copy()

    # -----------------------------------------------------
    # THRESHOLD FILTER LOGIC
    # -----------------------------------------------------

    def apply_threshold_math(
        data,
        crl_rank,
        cat_rank,
        valid_categories
    ):

        if data.empty:
            return pd.DataFrame()

        all_matches = []

        # -------------------------
        # OPEN CATEGORY
        # -------------------------

        open_pool = data[
            data['clean_category'].isin(
                ['OPEN', 'OPEN (PWD)']
            )
        ].copy()

        open_eligible = open_pool[
            crl_rank <= (
                open_pool[
                    'predicted_closing_rank_2026'
                ] * 1.25
            )
        ].copy()

        all_matches.append(open_eligible)

        # -------------------------
        # CATEGORY SEATS
        # -------------------------

        category_pool = data[
            data['clean_category']
            .isin(valid_categories)
        ].copy()

        if cat_rank and cat_rank > 0:

            category_eligible = category_pool[
                cat_rank <= (
                    category_pool[
                        'predicted_closing_rank_2026'
                    ] * 1.25
                )
            ].copy()

            all_matches.append(category_eligible)

        if len(all_matches) == 0:
            return pd.DataFrame()

        return pd.concat(all_matches)

    # -----------------------------------------------------
    # MAIN + ADV FILTERING
    # -----------------------------------------------------

    main_matches = apply_threshold_math(
        non_iit_df,
        ranks.get('main_crl', 0),
        ranks.get('main_cat', 0),
        valid_categories
    )

    adv_matches = apply_threshold_math(
        iit_df,
        ranks.get('adv_crl', 0),
        ranks.get('adv_cat', 0),
        valid_categories
    )

    # -----------------------------------------------------
    # COMBINE RESULTS
    # -----------------------------------------------------

    final_df = pd.concat([
        main_matches,
        adv_matches
    ])

    if final_df.empty:
        return pd.DataFrame()

    # -----------------------------------------------------
    # REMOVE DUPLICATES
    # -----------------------------------------------------

    final_df['seat_priority'] = (
        final_df['Seat Type']
        .apply(
            lambda x:
            1 if "OPEN" in str(x).upper()
            else 2
        )
    )

    final_df = final_df.sort_values(
        by=[
            'Institute',
            'branch_shortcut',
            'seat_priority'
        ]
    )

    final_df = final_df.drop_duplicates(
        subset=[
            'Institute',
            'branch_shortcut'
        ],
        keep='first'
    )

    final_df = final_df.drop(
        columns=['seat_priority']
    )

    # -----------------------------------------------------
    # SORT
    # -----------------------------------------------------

    final_df = final_df.sort_values(
        by='predicted_closing_rank_2026',
        ascending=True
    )

    # -----------------------------------------------------
    # FINAL COLUMNS
    # -----------------------------------------------------

    display_cols = [
        'Institute',
        'institute_type',
        'branch_shortcut',
        'degree_type',
        'Seat Type',
        'college_state',
        'Quota',
        'predicted_closing_rank_2026',
        'Global_Prestige_Index',
        'Global_Branch_Popularity'
    ]

    return final_df[display_cols]