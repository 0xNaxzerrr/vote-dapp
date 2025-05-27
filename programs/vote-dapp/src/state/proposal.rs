use anchor_lang::prelude::*;

#[account]
pub struct Proposal {
    pub title: String,
    pub description: String,
    pub choices: Vec<Choice>,
    pub deadline: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Choice {
    pub label: String,
    pub count: u64,
}