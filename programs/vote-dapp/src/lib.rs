use anchor_lang::prelude::*;
pub mod constants;
pub mod errors;
pub mod state;
pub mod instructions;
use instructions::*;
declare_id!("AUqeptucAezP3rnpe8purvbmECFTMd11DFjFB9BrvpqD");

#[program]
pub mod vote_app {
    use super::*;

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        choices: Vec<String>,
        deadline: u64,
    ) -> Result<()> {
        instructions::create_proposal(ctx, title, description, choices, deadline)
    }

    pub fn cast_vote(ctx: Context<CastVote>, user_choice: u8) -> Result<()> {
        instructions::vote(ctx, user_choice)
    }

    pub fn delete_proposal(ctx: Context<DeleteProposal>) -> Result<()> {
        instructions::delete_proposal(ctx)
    }
}