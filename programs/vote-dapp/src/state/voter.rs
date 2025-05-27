use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Voter {
    pub proposal: Pubkey,
    pub user: Pubkey,
    pub choice_option: u8,
}