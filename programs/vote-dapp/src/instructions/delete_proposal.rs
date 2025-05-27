use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use crate::{
    errors::ProposalError,
    state::*,
};

pub fn delete_proposal(ctx: Context<DeleteProposal>) -> Result<()> {
    let proposal = &ctx.accounts.proposal;
    let current_time = Clock::get()?.unix_timestamp as u64;
    let one_month = 30 * 24 * 60 * 60; // 30 days in seconds
    
    require!(
        current_time >= proposal.deadline + one_month,
        ProposalError::ProposalNotExpiredEnough
    );

    Ok(())
}

#[derive(Accounts)]
pub struct DeleteProposal<'info> {
    #[account(
        mut,
        close = signer
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
} 