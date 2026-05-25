import pandas as pd
import numpy as np
import math
from fetch_eligible import fetch_eligible_colleges

# ---------------------------------------------------------
# 1. STATIC PROXIMITY MAP
# ---------------------------------------------------------
PROXIMITY_MAP = {
    'ANDHRA PRADESH': ['TELANGANA', 'TAMIL NADU', 'KARNATAKA', 'ODISHA', 'CHHATTISGARH'],
    'ARUNACHAL PRADESH': ['ASSAM', 'NAGALAND'],
    'ASSAM': ['ARUNACHAL PRADESH', 'NAGALAND', 'MANIPUR', 'MIZORAM', 'TRIPURA', 'MEGHALAYA', 'WEST BENGAL'],
    'BIHAR': ['UTTAR PRADESH', 'JHARKHAND', 'WEST BENGAL'],
    'CHANDIGARH': ['PUNJAB', 'HARYANA', 'HIMACHAL PRADESH'],
    'CHHATTISGARH': ['MADHYA PRADESH', 'MAHARASHTRA', 'TELANGANA', 'ANDHRA PRADESH', 'ODISHA', 'JHARKHAND', 'UTTAR PRADESH'],
    'DAMAN AND DIU': ['GUJARAT', 'MAHARASHTRA'],
    'DELHI': ['HARYANA', 'UTTAR PRADESH', 'RAJASTHAN'],
    'GOA': ['MAHARASHTRA', 'KARNATAKA'],
    'GUJARAT': ['RAJASTHAN', 'MADHYA PRADESH', 'MAHARASHTRA', 'DAMAN AND DIU'],
    'HARYANA': ['PUNJAB', 'HIMACHAL PRADESH', 'RAJASTHAN', 'DELHI', 'UTTAR PRADESH', 'CHANDIGARH'],
    'HIMACHAL PRADESH': ['JAMMU AND KASHMIR', 'LADAKH', 'PUNJAB', 'HARYANA', 'UTTARAKHAND', 'UTTAR PRADESH'],
    'JAMMU AND KASHMIR': ['HIMACHAL PRADESH', 'PUNJAB', 'LADAKH'],
    'JHARKHAND': ['BIHAR', 'UTTAR PRADESH', 'CHHATTISGARH', 'ODISHA', 'WEST BENGAL'],
    'KARNATAKA': ['GOA', 'MAHARASHTRA', 'TELANGANA', 'ANDHRA PRADESH', 'TAMIL NADU', 'KERALA'],
    'KERALA': ['KARNATAKA', 'TAMIL NADU'],
    'LADAKH': ['JAMMU AND KASHMIR', 'HIMACHAL PRADESH'],
    'MADHYA PRADESH': ['UTTAR PRADESH', 'CHHATTISGARH', 'MAHARASHTRA', 'GUJARAT', 'RAJASTHAN'],
    'MAHARASHTRA': ['GUJARAT', 'MADHYA PRADESH', 'CHHATTISGARH', 'TELANGANA', 'KARNATAKA', 'GOA'],
    'MANIPUR': ['NAGALAND', 'MIZORAM', 'ASSAM'],
    'MEGHALAYA': ['ASSAM'],
    'MIZORAM': ['TRIPURA', 'ASSAM', 'MANIPUR'],
    'NAGALAND': ['ARUNACHAL PRADESH', 'ASSAM', 'MANIPUR'],
    'ODISHA': ['WEST BENGAL', 'JHARKHAND', 'CHHATTISGARH', 'ANDHRA PRADESH'],
    'PUDUCHERRY': ['TAMIL NADU', 'KERALA', 'ANDHRA PRADESH'],
    'PUNJAB': ['JAMMU AND KASHMIR', 'HIMACHAL PRADESH', 'HARYANA', 'RAJASTHAN', 'CHANDIGARH'],
    'RAJASTHAN': ['PUNJAB', 'HARYANA', 'UTTAR PRADESH', 'MADHYA PRADESH', 'GUJARAT'],
    'SIKKIM': ['WEST BENGAL'],
    'TAMIL NADU': ['ANDHRA PRADESH', 'KARNATAKA', 'KERALA', 'PUDUCHERRY'],
    'TELANGANA': ['ANDHRA PRADESH', 'MAHARASHTRA', 'KARNATAKA', 'CHHATTISGARH'],
    'TRIPURA': ['ASSAM', 'MIZORAM'],
    'UTTAR PRADESH': ['UTTARAKHAND', 'HIMACHAL PRADESH', 'HARYANA', 'DELHI', 'RAJASTHAN', 'MADHYA PRADESH', 'CHHATTISGARH', 'JHARKHAND', 'BIHAR'],
    'UTTARAKHAND': ['HIMACHAL PRADESH', 'UTTAR PRADESH'],
    'WEST BENGAL': ['ODISHA', 'JHARKHAND', 'BIHAR', 'SIKKIM', 'ASSAM']
}

# ---------------------------------------------------------
# 2. HELPER FUNCTIONS
# ---------------------------------------------------------
def compute_branch_multiplier(branch, popularity_index, max_popularity, preferred_branches):
    """Calculates branch score from 1.0 to 0.01 using explicit decay and market fallback."""
    total_branches = len(preferred_branches)
    
    if branch in preferred_branches:
        if total_branches == 1:
            return 1.0
        idx = preferred_branches.index(branch)
        position_ratio = idx / (total_branches - 1)
        return math.exp(-2.3 * position_ratio) 
        
    else:
        if pd.isna(popularity_index) or max_popularity <= 1:
            return 0.01
            
        penalty_ratio = (popularity_index - 1) / (max_popularity - 1)
        score = 0.09 - (0.08 * penalty_ratio)
        return max(0.01, score)

def compute_location_multiplier(college_state, home_state):
    """Softened proximity curve to prevent rank overriding."""
    neighbors = PROXIMITY_MAP.get(home_state, [])
    
    if college_state == home_state:
        return 1.0
    elif college_state in neighbors:
        return 0.85
    else:
        return 0.60

# FINAL FUNCTION, WHICH GIVES THE RESULTANT LIST TO BE DISPLAYED IN FRONT END
# Example use:

# student_profile = {
#     'category': 'SC',
#     'gender': 'GENDER-NEUTRAL',
#     'home_state': 'TELANGANA',
#     'ranks': {
#         'main_crl': 23000,
#         'main_cat': 2369,
#         'adv_crl': 14070,      
#         'adv_cat': 2030
#     }
# }

# user_prefs = {
#     'branches': [
#         'COMPUTER SCIENCE AND ENGINEERING', 
#         'ARTIFICIAL INTELLIGENCE AND DATA SCIENCE',
#         'MATHEMATICS AND COMPUTING',
#         'ELECTRONICS AND COMMUNICATION ENGINEERING',
#         'ELECTRICAL ENGINEERING'
#     ],
#     'home_state': 'TELANGANA'
# }

# student_budget = {
#     'branch': 15,     
#     'prestige': 75,   
#     'location': 10    
# }

# db_file = "JOSAA_2026_Predicted_Cutoffs.csv"
# results = fetch_eligible_colleges(db_file, student_profile)
# final_dashboard_data = generate_personalized_rankings(results, user_prefs, student_budget)
def generate_personalized_rankings(eligible_df, user_preferences, budget_weights):
    """
    Applies the 100-point budget math to sort the eligible JoSAA dataframe.
    """
    if eligible_df.empty:
        return pd.DataFrame()

    df = eligible_df.copy()
    
    preferred_branches = [str(b).strip().upper() for b in user_preferences.get('branches', [])]
    home_state = str(user_preferences.get('home_state', '')).strip().upper()
    

    raw_weights = [
        budget_weights.get('branch', 34), 
        budget_weights.get('prestige', 33), 
        budget_weights.get('location', 33)
    ]
    total_weight = sum(raw_weights) if sum(raw_weights) > 0 else 100
    
    w_branch = (raw_weights[0] / total_weight) * 100
    w_prestige = (raw_weights[1] / total_weight) * 100
    w_location = (raw_weights[2] / total_weight) * 100

    # --- MULTIPLIER 1: BRANCH ---
    max_pop = df['Global_Branch_Popularity'].max()
    df['branch_multi'] = df.apply(
        lambda row: compute_branch_multiplier(
            str(row['branch_shortcut']).strip().upper(), 
            row['Global_Branch_Popularity'], 
            max_pop, 
            preferred_branches
        ), axis=1
    )
    
    # --- MULTIPLIER 2: LOCATION ---
    df['location_multi'] = df['college_state'].astype(str).str.strip().str.upper().apply(
        lambda x: compute_location_multiplier(x, home_state)
    )
    
    # --- MULTIPLIER 3: PRESTIGE (Exponential Curve) ---
    min_prestige = df['Global_Prestige_Index'].min()
    max_prestige = df['Global_Prestige_Index'].max()
    
    if max_prestige > min_prestige:
        df['prestige_multi'] = df['Global_Prestige_Index'].apply(
            lambda x: math.exp(-1.5 * ((x - min_prestige) / (max_prestige - min_prestige)))
        )
    else:
        df['prestige_multi'] = 1.0

    # --- FINAL UTILITY SCORING ---
    df['final_utility_score'] = (
        (w_branch * df['branch_multi']) +
        (w_prestige * df['prestige_multi']) +
        (w_location * df['location_multi'])
    )


    df['final_utility_score'] += (1 - (df['predicted_closing_rank_2026'] / 1000000)) * 0.01

    ranked_df = df.sort_values(
        by=['final_utility_score', 'Global_Prestige_Index'], 
        ascending=[False, True]
    )
    
    ranked_df['final_utility_score'] = ranked_df['final_utility_score'].round(2)

    display_cols = [
        'Institute', 'branch_shortcut', 'degree_type', 'college_state', 'Quota', 'Seat Type', 
        'predicted_closing_rank_2026', 'Global_Prestige_Index', 
        'Global_Branch_Popularity', 'final_utility_score'
    ]
    
    final_cols = [col for col in display_cols if col in ranked_df.columns]
    
    return ranked_df[final_cols]