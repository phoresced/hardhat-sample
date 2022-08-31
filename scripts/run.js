const hre = require('hardhat')

const main = async () => {
  const rsvpContractFactory = await hre.ethers.getContractFactory('Web3RSVP')
  const rsvpContract = await rsvpContractFactory.deploy()
  await rsvpContract.deployed()
  console.log('Contract deployed to:', rsvpContract.address)

  // get our deployer wallet address and a couple others for testing - destructured getSigners method
  const [deployer, address1, address2] = await hre.ethers.getSigners()

  // Before we can call this method, we need to define the event data we are going to use
  let deposit = hre.ethers.utils.parseEther('1')
  let maxCapacity = 3
  let timestamp = 1718926200
  let eventDataCID =
    'bafybeibhwfzx6oo5rymsxmkdxpmkfwyvbjrrwcl7cekmbzlupmp5ypkyfi'

  // create a new event with our mock data. txn.wait will return data about the transaction once the transaction completes, incl an array of the emitted events.
  let txn = await rsvpContract.createNewEvent(
    timestamp,
    deposit,
    maxCapacity,
    eventDataCID
  )
  let wait = await txn.wait()
  console.log('NEW EVENT CREATED:', wait.events[0].event, wait.events[0].args)

  // save the eventID created so we can use it to RSVP.
  let eventID = wait.events[0].args.eventID
  console.log('EVENT ID:', eventID)

  txn = await rsvpContract.createNewRSVP(eventID, { value: deposit })
  wait = await txn.wait()
  console.log('NEW RSVP:', wait.events[0].event, wait.events[0].args)

  txn = await rsvpContract
    .connect(address1)
    .createNewRSVP(eventID, { value: deposit })
  wait = await txn.wait()
  console.log('NEW RSVP:', wait.events[0].event, wait.events[0].args)
  // ^ By default, Hardhat will call our contract functions from the deployer wallet address (re: line 10). To call a contract function from another wallet, we can use the .connect(address) modifier.

  txn = await rsvpContract
    .connect(address2)
    .createNewRSVP(eventID, { value: deposit })
  wait = await txn.wait()
  console.log('NEW RSVP:', wait.events[0].event, wait.events[0].args)

  txn = await rsvpContract.confirmAllAttendees(eventID)
  wait = await txn.wait()
  wait.events.forEach((event) =>
    console.log('CONFIRMED:', event.args.attendeeAddress)
  )

  // wait 10 years
  await hre.network.provider.send('evm_increaseTime', [15778800000000])

  txn = await rsvpContract.withdrawUnclaimedDeposits(eventID)
  wait = await txn.wait()
  console.log('WITHDRAWN:', wait.events[0].event, wait.events[0].args)
}

const runMain = async () => {
  try {
    await main()
    process.exit(0)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

runMain()
