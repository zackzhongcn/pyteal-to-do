from pyteal import *
from pyteal.ast.bytes import Bytes
from pyteal_helpers import program

PIN = 1214
reward_token_id = 121814966


def approval():
    # globals
    g_owner = Bytes("Owner")  # byteslices
    g_task_creation_fee = Bytes("TaskCreationFee")  # uint64
    g_deposit = Bytes("Deposit")  # unit64
    g_reward_token_id = Bytes("RewardTokenId")  # uint64
    g_reward_pool = Bytes("RewardPool")  # uint64
    g_reward_rate = Bytes("RewardRate")  # uint64
    g_given_reward = Bytes("GivenReward")  # uint64

    # locals
    l_deposit = Bytes("deposit")  # unit64
    l_reward = Bytes("reward")  # unit64
    l_task_summary = Bytes("taskSummary")  # byteslices
    l_task_description = Bytes("taskDescription")  # byteslices
    l_deadline = Bytes("deadline")  # uint64
    l_result = Bytes("result")  # uint64

    # operations
    op_create_task = Bytes("createTask")
    op_close_task = Bytes("closeTask")
    op_pump_token = Bytes("pumpToken")
    op_update_settings = Bytes("updateSettings")
    op_optin_token = Bytes("optinToken")

    @Subroutine(TealType.none)
    def create_task():
        count_tally = ScratchVar(TealType.uint64)
        return Seq(
            program.check_self(
                group_size=Int(2),
                group_index=Int(0),
            ),
            program.check_rekey_zero(2),
            Assert(
                And(
                    Gtxn[1].type_enum() == TxnType.AssetTransfer,
                    Gtxn[1].asset_receiver(
                    ) == Global.current_application_address(),
                    Gtxn[1].asset_amount() >= App.globalGet(
                        g_task_creation_fee),  # checking correct amount
                    Gtxn[1].xfer_asset() == App.globalGet(
                        g_reward_token_id),  # checking correct token
                    Txn.application_args.length() == Int(4),
                    App.localGet(Txn.sender(), l_deadline) == Int(
                        0),  # default deadline must be 0
                )
            ),

            # Update task here
            App.localPut(Txn.sender(), l_task_summary,
                         Txn.application_args[1]),
            App.localPut(Txn.sender(), l_task_description,
                         Txn.application_args[2]),
            App.localPut(Txn.sender(), l_deadline,
                         Btoi(Txn.application_args[3])),
            App.localPut(Txn.sender(), l_deposit, Gtxn[1].asset_amount()),

            count_tally.store(App.globalGet(g_deposit)),
            App.globalPut(g_deposit, count_tally.load() +
                          Gtxn[1].asset_amount()),

            Approve(),
        )

    @Subroutine(TealType.none)
    def close_task():
        tmp_reward = ScratchVar(TealType.uint64)
        total_given_reward = ScratchVar(TealType.uint64)
        return Seq(
            program.check_self(
                group_size=Int(1),
                group_index=Int(0),
            ),
            program.check_rekey_zero(1),
            tmp_reward.store(Div(Mul(App.globalGet(g_reward_rate),
                             App.localGet(Txn.sender(), l_deposit)), Int(100))),
            Assert(
                And(
                    Txn.application_args.length() == Int(3),
                    Btoi(Txn.application_args[1]) == Int(PIN),
                    App.globalGet(
                        g_reward_pool) >= tmp_reward.load(),  # contract has enough balance for reward
                    App.localGet(Txn.sender(), l_deadline) >= Int(0),
                    App.localGet(Txn.sender(), l_result) == Int(0),
                    Or(
                        Btoi(Txn.application_args[2]) == Int(1),
                        Btoi(Txn.application_args[2]) == Int(2),
                    )
                )
            ),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields(
                {
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.asset_receiver: Txn.sender(),
                    TxnField.asset_amount: tmp_reward.load(),
                    TxnField.xfer_asset: App.globalGet(g_reward_token_id),
                }),
            InnerTxnBuilder.Submit(),

            # update the task status
            App.localPut(Txn.sender(), l_result,
                         Btoi(Txn.application_args[2])),
            App.localPut(Txn.sender(), l_reward, tmp_reward.load()),

            total_given_reward.store(App.globalGet(g_given_reward)),
            App.globalPut(g_given_reward,
                          total_given_reward.load() + tmp_reward.load()),

            Approve(),
        )

    @Subroutine(TealType.none)
    def pump_token():
        count_tally = ScratchVar(TealType.uint64)
        return Seq(
            program.check_self(
                group_size=Int(2),
                group_index=Int(0),
            ),
            program.check_rekey_zero(2),
            Assert(
                And(
                    Gtxn[1].type_enum() == TxnType.AssetTransfer,
                    Gtxn[1].asset_receiver(
                    ) == Global.current_application_address(),
                    Gtxn[1].xfer_asset() == App.globalGet(
                        g_reward_token_id),  # Checking correct token
                    Txn.application_args.length() == Int(1),
                )
            ),

            # Update reward pool
            count_tally.store(App.globalGet(g_reward_pool)),
            App.globalPut(g_reward_pool,
                          count_tally.load() + Gtxn[1].asset_amount()),

            Approve(),
        )

    @Subroutine(TealType.none)
    def update_settings():
        return Seq(
            program.check_rekey_zero(1),
            Assert(
                And(
                    Txn.sender() == App.globalGet(g_owner),
                    Txn.application_args.length() == Int(3),
                )
            ),

            # Update admin settings
            App.globalPut(g_reward_rate, Btoi(Txn.application_args[1])),
            App.globalPut(g_task_creation_fee,
                          Btoi(Txn.application_args[2])),

            Approve(),
        )

    @Subroutine(TealType.none)
    def opt_in_token():
        return Seq(
            program.check_self(
                group_size=Int(1),
                group_index=Int(0),
            ),
            program.check_rekey_zero(1),
            Assert(
                And(
                    Txn.sender() == App.globalGet(g_owner),
                    Txn.application_args.length() == Int(2),
                )
            ),

            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields(
                {
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.asset_receiver: Global.current_application_address(),
                    TxnField.asset_amount: Int(0),
                    TxnField.xfer_asset: Btoi(Txn.application_args[1]),
                }),
            InnerTxnBuilder.Submit(),
            Approve(),
        )

    @Subroutine(TealType.none)
    def handle_creation():
        return Seq(
            # Admin settings
            App.globalPut(g_owner, Txn.sender()),
            # The token required to send to be able to make a vote
            App.globalPut(g_reward_token_id,
                          Btoi(Txn.application_args[0])),
            App.globalPut(g_deposit, Int(0)),
            App.globalPut(g_task_creation_fee, Int(1000000)),  # 1 Algos
            App.globalPut(g_reward_rate, Btoi(Txn.application_args[1])),
            App.globalPut(g_reward_pool, Int(0)),
            App.globalPut(g_given_reward, Int(0)),

            Approve(),
        )

    return program.event(
        init=Seq(
            handle_creation(),
            Approve(),
        ),
        opt_in=Seq(
            Approve(),
        ),
        no_op=Seq(
            Cond(
                [Txn.application_args[0] == op_create_task, create_task()],
                [Txn.application_args[0] == op_close_task, close_task()],
                [Txn.application_args[0] == op_pump_token, pump_token()],
                [Txn.application_args[0] == op_update_settings, update_settings()],
                [Txn.application_args[0] == op_optin_token, opt_in_token()],
            ),
            Reject(),
        ),
    )


def clear():
    return Approve()
