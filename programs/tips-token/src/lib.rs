use anchor_lang::prelude::*;

declare_id!("ApvtKKB1ZgfSB79jezCNossC7H3faQJKizVTLGsx2JxP");

#[program]
pub mod tips_token {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
