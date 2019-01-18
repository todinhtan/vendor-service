const {UserIndexMap, UserInfoMap, UserBookingCount,
    ServiceIndexMap, ServiceInfoMap, CategoryMap, UserServiceRating,
    users, services, campaigns, bookings, categories, reviews, TSMCards} = require('../models/Mapping');

const mappingHandlers = {
    "pods.created": (data) => {
        console.log("user mapping:", data);
        infoUser(data);
    },
    "cards.service.created": (data) => {
        console.log("cards mapping:",data);
        indexService(data);
        infoService(data);
    },
    "cards.offer.created": (data) => {
        console.log("cards mapping:",data);
    },
    "cards.service.updated": (data) => {
        // console.log("cards mapping:",data);
    },
    "cards.offer.updated": (data) => {
        console.log("cards mapping:",data);
    },
    "cards.service.deleted": (data) => {
        // console.log("cards mapping:",data);
        deleteService(data);
    },
    "cards.offer.deleted": (data) => {
        console.log("cards mapping:",data);
    }
};

const deleteService = async (data) => {
    const {id} = data;
    await ServiceIndexMap.find({service_uuid:id}).remove();
    await ServiceInfoMap.find({service_uuid:id}).remove();
}

const countBooking = async (data) => {
    const {customer_user_id, service_id} = data;
    const id = data._id['$oid'];
    const user = await UserIndexMap.findOne({vendor_user_id:customer_user_id}, 'user_uuid');
    const service = await ServiceIndexMap.findOne({vendor_service_id: service_id}, 'service_uuid');
    if (user && service) {
        const {user_uuid} = user.toObject();
        const {service_uuid} = service.toObject();
        let newData = {
            user_uuid,
            service_uuid,
            booking_id: id
        };
        console.log("info",newData);
        await UserBookingCount.findOneAndUpdate({service_uuid, booking_id: id}, newData, {upsert:true});
    }
};

const ratingMap = async (data) => {
    try {
        const {booking_id, rating_overall_stats} = data;

        const userBookings = await UserBookingCount.find({booking_id});
        if (userBookings) {
            userBookings.forEach(async booking => {
                const {user_uuid, service_uuid} = booking.toObject();
                let info = {
                    rating: rating_overall_stats,
                    user_uuid, service_uuid
                };
               await UserServiceRating.findOneAndUpdate({user_uuid, service_uuid}, info, {upsert:true})
            });
        }
        return {data};
    } catch (e) {
        console.log(e);
        return null;
    }
};

const infoUser = async (data) => {
    const {vip_tier,gender,age} = data.vendorSpecificInfo;
    const info = {
        "user_uuid": data.vendorAccessToken,
        "vendor_user_id": data.signatures["vendors.vanitee.userId"],
        vip_tier,gender,age
    };
    const query = {
        "user_uuid": data.vendorAccessToken
    };
    await UserInfoMap.findOneAndUpdate(query, info, {upsert:true})
};

const indexUser = async (data) => {
    const info = {
        "user_uuid": data.vendorAccessToken,
        "vendor_user_id": data.signatures["vendors.vanitee.userId"]
    };
    await UserIndexMap.findOneAndUpdate({"user_uuid": data.vendorAccessToken}, info, {upsert:true});
}

const indexService = async (data) => {

    const info = {
        "service_uuid": data.id,
        "vendor_service_id": data.vendorItemIdentifier
    };
    await ServiceIndexMap.findOneAndUpdate({ "service_uuid": data.id}, info, {upsert:true});
}

const infoService = async (data) => {
    const {id, vendorItemIdentifier, title, description} = data;
    const {category_level_1_id, category_level_2_id, category_level_3_id,
        category_level_1_name, category_level_2_name, category_level_3_name} = JSON.parse(data.vendorSpecificInfo.value);
    const info = {
        category_level_1_uuid: category_level_1_id,
        category_level_2_uuid: category_level_2_id,
        category_level_3_uuid: category_level_3_id,
        category_level_1_name: category_level_1_name,
        category_level_2_name: category_level_2_name,
        category_level_3_name: category_level_3_name,
        title,
        description,
        service_uuid: id,
        vendor_service_id: vendorItemIdentifier
    };
    await ServiceInfoMap.findOneAndUpdate({ "service_uuid": id}, info, {upsert:true});
}

const registerHandlers = (sockjs) => {
    sockjs.send(JSON.stringify({
        type:"register",
        address:"pods.created"
    }));

    sockjs.send(JSON.stringify({
        type:"register",
        address:"cards.service.created"
    }));

    sockjs.send(JSON.stringify({
        type:"register",
        address:"cards.offer.created"
    }));

    sockjs.send(JSON.stringify({
        type:"register",
        address:"cards.service.updated"
    }));

    sockjs.send(JSON.stringify({
        type:"register",
        address:"cards.service.deleted"
    }));

    sockjs.send(JSON.stringify({
        type:"register",
        address:"cards.offer.updated"
    }));
};

const createDummyData = (table, data) => {
    try {
        console.log(data)
        let record = Object.assign({}, data);
        record.vendor_oid = record._id["$oid"];
        record.updated_at = record.updated_at ? new Date(record.updated_at["$date"]) : undefined;
        record.created_at = record.created_at ? new Date(record.created_at["$date"]): undefined;
        record.deleted_at = record.deleted_at ? new Date(record.deleted_at["$date"]) : undefined;
        record.published_at = record.published_at ? new Date(record.published_at["$date"]) : undefined;
        record.deactivated_at = record.deactivated_at ? new Date(record.deactivated_at["$date"]) : undefined;
        delete record._id
        // delete record.updated_at
        // delete record.created_at
        // delete record.deleted_at
        // delete record.published_at
        // delete record.deactivated_at
        getModel = {
            users: () => {
                return new users(record);
            },
            services: () => {
                return new services(record);
            },
            campaigns: () => {
                return new campaigns(record);
            },
            bookings: () => {
                return new bookings(record);
            },
            categories: () => {
                return new categories(record);
            },
            reviews: () => {
                return new reviews(record);
            }
        }
        console.log(record)
        r = getModel[table]();
        r.save();
    } catch(e) {
        console.log(e)
    }
}

const createTSMCards = async (sockjs, record) => {
    try{
        const {id, Title: title, Content: content, Permalink: uri, 'Product tags': tags, 'Image URL': imageUri, imageSummary, 'Product categories': category } = record;
        const { 'Product Type': productType, SKU, 'Short Description': shortDescription
            ,'Product Stores': productStores, 'External Product URL': externalProductURL, 'Product Visibility': productVisibility } = record;
        const vendorSpecificInfo = {productType, SKU, shortDescription, productStores, externalProductURL, productVisibility};
        const data = {
            vendorItemIdentifier: id,
            title,
            content,
            uri,
            tags,
            imageUri,
            imageSummary,
            vendorSpecificInfo,
            category
        };
        sockjs.send(JSON.stringify({
            address: 'cards.batch',
            body: {
                cardObject: data,
                vendorId: record.ownerId,
                action: "create",
                cardType: "tsm" // liase with platform
            },
            type: 'send',
            headers: {'ContentType': 'Application/Json'}
        }));
        // let tsmCard = new TSMCards(data);
        // await tsmCard.save();
        await TSMCards.findOneAndUpdate({vendorItemIdentifier: id}, data, {upsert:true});
        return {data};
    } catch (e) {
        console.log(e)
    }
};

const loadData = (sockjs, type, record) => {
    try {
        const funcs = {
            "tsm_cards": () => {
                return createTSMCards(sockjs, record);
            },
            "users": () => {
                return createPod(sockjs, record);
            },
            "services": () => {
                return createCardFromServices(sockjs, record);
            },
            "campaigns": () => {
                return createCardFromCampaign(sockjs, record);
            },
            "categories": () => {
                return updateCardFromCategory(sockjs, record);
            },
            "bookings": () => {
                return updateCardFromBooking(sockjs, record);
            },
            "reviews": () => {
                ratingMap(record);
                return {data:record};
            }
        };
        return funcs[type]();
    } catch (e) {
        return {error:e}
    }
};

const createPod = (sockjs, record) => {
    try {
        console.log("createPod",record);
        const {vip_tier, gender} = record;
        const age = record.date_of_birth ? 2018 - parseInt(record.date_of_birth["$date"].split('-')[0], 10) : undefined;
        let data = {signatures: {}, vendorId: record.ownerId,
            vendorSpecificInfo: {vip_tier, gender, age}};
        data.signatures["vendors." + record.ownerId +".userId"] = record._id["$oid"];
        sockjs.send(JSON.stringify({
            address: 'pods.batch',
            body: data,
            type: 'send',
            headers: {'ContentType': 'Application/Json'}
        }));
        return {data}
    } catch(e) {
        console.log(e);
        return {error:e};
    }
};

const checkServiceActivated = ({published_at, deactivated_at, deleted_at}) => {
    const published = published_at ? new Date(published_at['$date']).getTime() : undefined;
    const deactivated = deactivated_at ? new Date(deactivated_at['$date']).getTime() : undefined;
    const deleted = deleted_at ? new Date(deleted_at['$date']).getTime() : undefined;
    if(published && !deactivated && !deleted) {
        return true;
    } else {
        return false;
    }
};

const createCardFromServices = (sockjs, record) => {
    try {
        const {published_at, deactivated_at, deleted_at} = record;
        const {title, description} = record;
        const {category_level_1_id, category_level_2_id, duration, professional_user_id} = record;
        const vendorSpecificInfo = {category_level_1_id, category_level_2_id, duration, professional_user_id};
        const data = {
            vendorItemIdentifier: record._id["$oid"],
            title,
            content: description,
            vendorSpecificInfo
        };
        if(checkServiceActivated({published_at, deactivated_at, deleted_at})) {
            sockjs.send(JSON.stringify({
                address: 'cards.batch',
                body: {
                    cardObject: data,
                    vendorId: record.ownerId,
                    action: "create",
                    cardType: "service"
                },
                type: 'send',
                headers: {'ContentType': 'Application/Json'}
            }));
        } else {
            sockjs.send(JSON.stringify({
                address: 'cards.batch',
                body: {
                    cardObject: data,
                    vendorId: record.ownerId,
                    action: "delete",
                    cardType: "service"
                },
                type: 'send',
                headers: {'ContentType': 'Application/Json'}
            }));
        }
        return {data}
    } catch(e) {
        console.log(e);
        return {error:e};
    }
};

const createCardFromCampaign = (sockjs, record) => {
    try {
        if (record.deal_belongs_to_professional_id === undefined) {
            return {};
        }
        const {is_listed} = record;
        const {name, service_category_ids, service_service_ids} = record;
        if (is_listed === undefined || is_listed === false) {
            sockjs.send(JSON.stringify({
                address: 'cards.batch',
                body: {
                    cardObject: {vendorItemIdentifier: record._id["$oid"]},
                    vendorId: record.ownerId,
                    action: "delete",
                    cardType: "offer"
                },
                type: 'send',
                headers: {'ContentType': 'Application/Json'}
            }));
        } else {
            const data = {
                vendorItemIdentifier: record._id["$oid"],
                title: name,
                content: JSON.stringify(service_service_ids),
                category: JSON.stringify(service_category_ids),
                vendorSpecificInfo: {
                    categories: service_category_ids
                }
            }
            sockjs.send(JSON.stringify({
                address: 'cards.batch',
                body: {
                    cardObject: data,
                    vendorId: record.ownerId,
                    action: "create",
                    cardType: "service"
                },
                type: 'send',
                headers: {'ContentType': 'Application/Json'}
            }));
        }
        return {data};
    } catch(e) {
        return {error:e}
    }
};

function updateCardFromBooking(sockjs, record) {
    try {

        const {address_id, address_name, address_country, address_city, address_state,
            address_address1, address_address2, address_postal_code,
            address_latitude, address_longitude, customer_user_id, action, category_name, service_ids} = record;
        let data = {
            vendorSpecificInfo: {
                customerUserId: customer_user_id,
                categoriesName: category_name,
                locationServicePerformed: {
                    address_id, address_name, address_country, address_city, address_state,
                    address_address1, address_address2, address_postal_code,
                    address_latitude, address_longitude
                }
            }
        };
        if(service_ids === undefined) {
            return {data}
        }
        service_ids.forEach(serviceId => {
            data.vendorItemIdentifier = serviceId;
            sockjs.send(JSON.stringify({
                address:"cards.batch",
                type:"send",
                body: {
                    cardObject: data,
                    vendorId: record.ownerId,
                    action: "update",
                    cardType: "service"
                },
                headers: {"ContentType": "Application/Json"}
            }));
            if (action === 1) {
                countBooking({service_id:serviceId,...record});
            }
        });

        return {data};
    } catch(e) {
        console.log(e);
        return {error:e};
    }
}

const updateCardFromCategory = async (sockjs, record) => {
    const {level, name} = record;
    const id = record._id['$oid'];
    let data = {
        categoryId:id,
        level,
        name
    };
    sockjs.send(JSON.stringify({
        address: "cards.batch",
        type:"send",
        body: {
            vendorId: record.ownerId,
            action: "updateCategory", // workaround for update vanitee category in vendorSpecificInfo
            categoryObject: data,
            cardType: "service"
        },
        headers: {"ContentType": "Application/Json"}
    }));
    console.log("record",record);
    const info = {
        category_uuid: id,
        category_level: level,
        parent_uuid: record.parent_id,
        category_name: name
    };
    await CategoryMap.findOneAndUpdate({ category_uuid: id }, info, {upsert:true});
    return {data};
};

module.exports = {loadData, registerHandlers, mappingHandlers};