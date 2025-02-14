import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "../../../../../../components/ui/tooltip"
import { FaPlus } from "react-icons/fa"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client";
import { CREATE_CHANNEL_ROUTES, GET_ALL_CONTACTS_ROUTES, SEARCH_CONTACTS_ROUTES } from "@/utils/constants"

import { useAppStore } from "@/store"
import { Button } from "@/components/ui/button"
import MultipleSelector from "@/components/ui/multiselect"

const CreateChannel = () => {
    const { setSelectedChatType, setSelectedChatData, addChannel } = useAppStore();
    const [newChannelModel, setNewChannelModel] = useState(false);
    const [allContatcs, setAllContatcs] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [channelName, setChannelName] = useState("");

    useEffect(() => {
        const getData = async () => {
            const response = await apiClient.get(GET_ALL_CONTACTS_ROUTES, {
                withCredentials: true,
            });
            setAllContatcs(response.data.contacts);
        };

        getData();
    }, []);

    const createChannel = async () => {
        try {
            if (channelName.length >= 0 && selectedContacts.length > 0) {
                const response = await apiClient.post(CREATE_CHANNEL_ROUTES, {
                    name: channelName,
                    members: selectedContacts.map((contact) => contact.value),
                },
                    { withCredentials: true }
                );

                if (response.status === 201) {
                    setNewChannelModel(false);
                    setChannelName("");
                    setSelectedContacts([]);
                    addChannel(response.data.channel);
                }
            }
        } catch (err) {
            console.log("Error here in front-end");
            console.log(err);
        }
    }

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <FaPlus className="text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all duration-300s"
                            onClick={() => setNewChannelModel(true)}
                        />
                    </TooltipTrigger>
                    <TooltipContent
                        className="bg-[#1c1b1e] border-none mb-2 p-3 text-white"
                    >
                        Create New Channel
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Dialog open={newChannelModel} onOpenChange={setNewChannelModel}>
                <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[400px] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Please fill up the details for new channel</DialogTitle>
                        <DialogDescription></DialogDescription>
                    </DialogHeader>
                    <div>
                        <Input placeholder="Channel Name" className="rounded-lg p-6 bg-[#2c2e3b] border-none"
                            value={channelName} onChange={e => setChannelName(e.target.value)}
                        />
                    </div>

                    <div>
                        <MultipleSelector
                            className="rounded-lg bg-[#2c2e3b] border-none py-2 text-white"
                            defaultOptions={allContatcs}
                            placeholder="Search Contacts"
                            value={selectedContacts}
                            onChange={setSelectedContacts}
                            emptyIndicator={
                                <p className="text-center text-lg leading-10 text-gray-600">No results Found.</p>
                            }
                        />
                    </div>

                    <div>
                        <Button className="w-full bg-purple-700 hover:bg-purple-900 transition-all duration-300"
                            onClick={createChannel}>
                            Create Channel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default CreateChannel;