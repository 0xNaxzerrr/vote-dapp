use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use crate::{
    errors::ProposalError,
    constants::*,
    state::*,
};

pub fn create_proposal(
    ctx: Context<CreateProposal>,
    title: String,
    description: String,
    choices: Vec<String>,
    deadline: u64,
) -> Result<()> {
    require!(
        (choices.len() as u64) <= MAX_CHOICES,
        ProposalError::MaxLengthChoices
    );
    let proposal = &mut ctx.accounts.proposal;
    proposal.title = title;
    proposal.description = description;
    proposal.deadline = deadline;
    let mut choices_vec = Vec::new();
    for choice in choices {
        choices_vec.push(Choice { label: choice, count: 0 });
    }
    proposal.choices = choices_vec;
    Ok(())
}

#[derive(Accounts)]
#[instruction(title: String, description: String, choices: Vec<String>)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = signer,
        space = 8
            + (4 + title.len())
            + (4 + description.len())
            + 8
            + 4
            + choices.iter().map(|c| 4 + c.len() + 8).sum::<usize>()
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}