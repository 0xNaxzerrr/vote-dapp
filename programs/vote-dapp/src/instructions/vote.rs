use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use crate::{
    errors::ProposalError,
    constants::*,
    state::*,
};

pub fn vote(ctx: Context<CastVote>, user_choice: u8) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    require!(
        Clock::get()?.unix_timestamp < proposal.deadline as i64,
        ProposalError::DeadlinePassed
    );
    let voter = &mut ctx.accounts.voter;
    voter.proposal = proposal.key();
    voter.user = ctx.accounts.signer.key();
    voter.choice_option = user_choice;
    require!(
        (proposal.choices.len() as u8) > user_choice,
        ProposalError::InvalidOption
    );
    proposal.choices[user_choice as usize].count += 1;
    Ok(())
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = signer,
        space = 8 + Voter::INIT_SPACE,
        seeds = [proposal.key().as_ref(), signer.key().as_ref()],
        bump
    )]
    pub voter: Account<'info, Voter>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}