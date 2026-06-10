Phân tích BE giá bán lương
No tasks in progress

quét về BE, phân tích về giá bán lời nhuận và lương, cần nâng cấp gì
3:02 PM

Worked for 2m 35s
Kết Quả Quét BE

Backend hiện mới quản lý giá bán và doanh thu, chưa đủ dữ liệu để tính lợi nhuận hoặc lương/hoa hồng đúng nghiệp vụ.

Các Vấn Đề Chính

Chưa thể tính lợi nhuận vì không có giá vốn

Product chỉ có price là giá bán tại product.schema.ts (line 20).
Phiếu nhập kho chỉ lưu số lượng, không lưu unitCost, batchCost hoặc giá trị nhập tại import-stock.dto.ts (line 10) và inventory-transaction.schema.ts (line 15).

Hệ quả: không tính được:

Giá vốn hàng bán (COGS)
Lợi nhuận gộp
Biên lợi nhuận theo sản phẩm/seller/đơn hàng
Giá trị tồn kho
Doanh thu đang ghi nhận sai kỳ

Báo cáo chỉ lấy đơn có trạng thái delivered, nhưng lọc và nhóm theo createdAt, không phải deliveredAt, tại reports.service.ts (line 130) và reports.service.ts (line 269).

Ví dụ: đơn tạo ngày 30/04, giao ngày 02/05 sẽ được tính doanh thu vào tháng 4 thay vì tháng 5.

KPI seller cũng mắc lỗi tương tự tại reports.service.ts (line 501).

Trả hàng làm biến mất doanh thu lịch sử

Đơn giao thành công có thể đổi từ delivered sang return_requested, rồi returned tại orders.service.ts (line 836) và orders.service.ts (line 749).

Vì báo cáo chỉ đếm trạng thái hiện tại là delivered, một đơn đã bán tháng trước sẽ biến mất khỏi doanh thu cũ ngay khi yêu cầu trả hàng phát sinh. Kế toán đúng nên giữ doanh thu gốc và ghi nhận khoản hoàn/trả tại ngày hoàn.

Khuyến mãi tặng sản phẩm chưa được thực thi trong đơn hàng

Schema có loại PRODUCT_GIFT tại promotion.schema.ts (line 6). Tuy nhiên khi tạo/cập nhật đơn, service chỉ xử lý giảm % hoặc giảm tiền tại orders.service.ts (line 273).

Hiện tại hàng tặng:

Không được thêm vào đơn
Không bị trừ kho
Không được tính vào chi phí khuyến mãi
Làm lợi nhuận dự kiến sai
Giá bán mới ở mức một bảng giá chung

Backend có điểm tốt: khi tạo đơn, server tự lấy product.price, sau đó snapshot vào OrderItem.price tại orders.service.ts (line 247). Client không thể tự sửa giá gửi lên.

Tuy nhiên chưa có:

Bảng giá theo nhà phân phối/khách hàng/khu vực
Lịch sử hiệu lực giá
Giá sỉ, giá bán lẻ, giá hợp đồng
Phê duyệt bán dưới biên lợi nhuận tối thiểu
Chưa có nghiệp vụ lương/hoa hồng

User chỉ lưu tài khoản, vai trò và quản lý trực tiếp tại user.schema.ts (line 12).
KPI chỉ có mục tiêu doanh thu/đơn/visit tại kpi.schema.ts (line 6).

Chưa có:

Lương cơ bản
Chính sách hoa hồng
Thưởng KPI
Trừ do trả hàng/hủy đơn
Kỳ chốt lương
Phiếu lương và trạng thái thanh toán
Nâng Cấp Nên Làm

Ưu tiên 1: Chuẩn hóa doanh thu và hoàn trả

Chuyển báo cáo doanh thu/KPI sang dùng deliveredAt.
Tạo cơ chế ghi nhận hoàn trả riêng theo returnedAt, không xóa doanh thu lịch sử.
Thêm báo cáo: grossSales, discount, netSales, returns, netRevenue.
Ưu tiên 2: Bổ sung giá vốn và lợi nhuận

Thêm giá vốn vào nghiệp vụ nhập kho: unitCost, totalCost, supplier, receivedAt.
Lưu snapshot giá vốn khi xuất hàng vào từng OrderItem: unitCost, costSubtotal.
Chọn phương pháp tính tồn kho: khuyến nghị bình quân gia quyền cho phiên bản đầu.
Bổ sung chỉ số:
grossProfit = netRevenue - COGS
grossMarginPercent
Lợi nhuận theo đơn, sản phẩm, seller, tháng
Ưu tiên 3: Hoàn thiện khuyến mãi và bảng giá

Thực thi PRODUCT_GIFT: thêm dòng hàng tặng giá bán 0, vẫn có giá vốn và trừ kho.
Phân bổ giảm giá xuống từng dòng hàng để tính lợi nhuận theo sản phẩm.
Tạo PriceList/PriceRule có thời gian hiệu lực và đối tượng áp dụng.
Chặn hoặc yêu cầu duyệt nếu giá bán sau giảm làm lợi nhuận âm.
Ưu tiên 4: Xây module lương/hoa hồng

Đề xuất tách khỏi User:

CompensationPolicy: lương cơ bản, tỷ lệ hoa hồng, bậc thưởng KPI, hiệu lực.
PayrollPeriod: tháng chốt, trạng thái draft/approved/paid/locked.
PayrollItem: doanh thu đủ điều kiện, lợi nhuận đủ điều kiện, hoa hồng, thưởng, khấu trừ trả hàng, tổng nhận.
Tính hoa hồng trên đơn đã giao, và điều chỉnh âm nếu hàng trả sau kỳ chốt.
Chính sách hợp lý hơn là hoa hồng theo lợi nhuận hoặc doanh thu có điều kiện biên lợi nhuận, không chỉ theo doanh thu; nếu không seller có thể bán nhiều nhưng công ty lỗ.

Ưu tiên 5: Bảo mật dữ liệu tài chính

price bán hàng có thể tiếp tục hiển thị cho seller.
unitCost, lợi nhuận và lương chỉ cho ADMIN hoặc vai trò tài chính mới.
Không trả giá vốn trong API /products đang được seller/mobile sử dụng tại products.controller.ts (line 46).
Kiến Trúc Dữ Liệu Tối Thiểu

Product {
price: number; // giá bán mặc định
averageCost: number; // giá vốn bình quân hiện tại
}

InventoryTransaction {
quantity: number;
unitCost?: number; // bắt buộc khi import
totalCost?: number;
}

OrderItem {
price: number; // snapshot giá bán
discountAllocated: number; // giảm giá phân bổ
netSales: number;
unitCost: number; // snapshot giá vốn lúc xuất
costSubtotal: number;
grossProfit: number;
}

PayrollPeriod {
month: number;
year: number;
status: "draft" | "approved" | "paid" | "locked";
}
Lộ Trình Khuyến Nghị

Sửa kỳ ghi nhận doanh thu theo deliveredAt và mô hình hoàn trả.
Bổ sung giá vốn nhập kho + snapshot giá vốn trên đơn.
Làm báo cáo lợi nhuận.
Hoàn thiện hàng tặng/bảng giá.
Sau khi dữ liệu lợi nhuận ổn định mới xây tính lương và hoa hồng.
Hiện trạng chưa nên triển khai tính lương dựa trên doanh thu hiện có, vì số doanh thu theo kỳ và ảnh hưởng trả hàng vẫn có thể sai.

3:03 PM
ví dụ admin tổng là nestle, có nhà phân phối, nhà pp có seller, seller đi thị trg tạo đơn cho admin duyệt, admin xuất đơn xuống cho nhà pp và npp đem hàng đưa tiệm thị trg bán, tính giá như nào, ai nhận tiền gì và lương như nào, nhà pp có đc lương hay chỉ nhận lời từ bán
3:06 PM

Worked for 3m 27s
Đúng mô hình DMS phổ biến thì cần tách rõ:

Admin / Nestlé: hãng hoặc chủ hệ thống.
Nhà phân phối (NPP): doanh nghiệp mua hàng từ Nestlé rồi phân phối lại trong khu vực.
Seller / DSR: nhân viên đi thị trường, thường thuộc NPP.
Tiệm / khách hàng: cửa hàng mua hàng để bán ra người tiêu dùng.
Trong mô hình này, NPP thường không nhận lương từ Nestlé. NPP kiếm tiền từ chênh lệch giá mua vào - giá bán ra, kèm thưởng doanh số/hỗ trợ thương mại nếu đạt điều kiện. Seller mới là người nhận lương và hoa hồng.

Luồng Nghiệp Vụ Nên Làm

Nestlé bán hàng số lượng lớn cho NPP theo giá NPP.
Hàng nhập vào kho của NPP.
Seller của NPP đi thị trường, ghé tiệm và tạo đơn đặt hàng.
Đơn nên được NPP duyệt/xuất kho/giao cho tiệm; Nestlé chỉ giám sát hoặc duyệt ngoại lệ/chính sách.
Tiệm thanh toán cho NPP.
NPP thanh toán công nợ mua hàng cho Nestlé.
NPP trả lương/hoa hồng cho seller của mình.
Nếu mỗi đơn tiệm đều do Nestlé duyệt rồi xuất hàng xuống NPP để NPP giao tiếp, hệ thống vẫn làm được nhưng vận hành chậm và khó quản lý tồn kho. Mô hình phù hợp hơn là Nestlé cấp hàng vào kho NPP trước, rồi NPP xử lý đơn thị trường.

Ví Dụ Giá Bán
Giả sử một thùng sản phẩm có các mức giá:

Loại giá Người bán Người mua Giá
Giá xuất hãng Nestlé NPP 180.000đ
Giá bán tiệm NPP Tiệm 200.000đ
Giá bán lẻ đề xuất Tiệm Người tiêu dùng 230.000đ
Nếu seller bán cho tiệm 100 thùng:

Nội dung Công thức Giá trị
Tiệm trả cho NPP 100 x 200.000 20.000.000đ
NPP trả/ghi nợ Nestlé 100 x 180.000 18.000.000đ
Lãi gộp NPP 20.000.000 - 18.000.000 2.000.000đ
Tiệm thu nếu bán hết 100 x 230.000 23.000.000đ
Lãi gộp tiệm 23.000.000 - 20.000.000 3.000.000đ
Đây mới là lãi gộp. NPP còn phải trừ:

Lương seller.
Chi phí giao hàng.
Kho bãi.
Hàng hỏng, cận date, trả hàng.
Chiết khấu cho tiệm.
Thuế và chi phí vận hành.
Ai Nhận Tiền Gì
Nestlé nhận:

Tiền bán hàng cho NPP theo giá xuất hãng.
Ví dụ: 18.000.000đ.
Nestlé không trực tiếp nhận tiền tiệm trong mô hình phân phối chuẩn.

NPP nhận:

Tiền bán hàng từ tiệm.
Ví dụ: 20.000.000đ.
Sau khi trừ giá mua từ Nestlé và chi phí vận hành, phần còn lại là lợi nhuận NPP.
Tiệm nhận:

Tiền từ người tiêu dùng khi bán lẻ.
Lợi nhuận là chênh lệch giữa giá bán lẻ và giá nhập từ NPP.
Seller nhận:

Lương cơ bản.
Phụ cấp nếu có.
Hoa hồng/thưởng theo doanh số, độ phủ, đơn giao thành công hoặc KPI.
Seller không nên thu toàn bộ lợi nhuận đơn hàng; seller là nhân viên bán hàng, không phải chủ hàng.

NPP Có Được Lương Không?
Thông thường: không.

NPP là một đơn vị kinh doanh độc lập, không phải nhân viên của Nestlé. Thu nhập của NPP gồm:

Biên lợi nhuận mua bán.
Thưởng doanh số từ Nestlé.
Thưởng mở mới điểm bán.
Hỗ trợ trưng bày/chương trình trade marketing.
Chiết khấu thanh toán sớm hoặc đạt sản lượng.
Ví dụ:

Khoản thu NPP Giá trị
Lãi gộp bán 100 thùng 2.000.000đ
Thưởng đạt doanh số tháng từ Nestlé 500.000đ
Tổng thu trước chi phí 2.500.000đ
Sau đó NPP tự dùng tiền này để trả lương seller, vận chuyển và chi phí khác.

Chỉ khi NPP thực chất là chi nhánh hoặc nhân sự nội bộ của Nestlé thì mới gọi là lương. Nhưng khi đó vai trò không nên đặt là distributor, mà nên là branch, sales supervisor hoặc warehouse.

Lương Seller Nên Tính Như Nào?
Seller thường thuộc NPP, nên NPP trả lương seller.

Một công thức dễ triển khai:

Thu nhập seller
= Lương cơ bản

- Phụ cấp
- Hoa hồng đơn đã giao thành công
- Thưởng KPI

* Điều chỉnh đơn bị trả/hủy
  Ví dụ tháng này seller có:

Nội dung Giá trị
Lương cơ bản 7.000.000đ
Phụ cấp xăng xe/điện thoại 1.000.000đ
Doanh số đã giao 100.000.000đ
Hoa hồng 0,5% doanh số giao thành công 500.000đ
Thưởng đạt KPI 1.000.000đ
Trừ do đơn trả hàng -100.000đ
Tổng nhận 9.400.000đ
Tuy nhiên, nếu chỉ thưởng theo doanh thu, seller có thể chạy giảm giá quá mạnh. Tốt hơn là có điều kiện:

Hoa hồng chỉ phát sinh nếu đơn:

- Đã giao thành công
- Không bị trả trong thời gian quy định
- Giá bán không thấp hơn mức tối thiểu
- Biên lợi nhuận đạt ngưỡng
  Hai Cách Tính Hoa Hồng Seller
  Cách 1: Theo doanh thu, dễ làm

Hoa hồng = Doanh thu đơn đã giao x tỷ lệ hoa hồng
Ví dụ seller bán giao thành công 100.000.000đ, tỷ lệ 0,5%:

Hoa hồng = 500.000đ
Ưu điểm: đơn giản, dễ hiểu.
Nhược điểm: không bảo vệ lợi nhuận NPP.

Cách 2: Theo lãi gộp, nên dùng khi hệ thống đã có giá vốn

Hoa hồng = Lãi gộp của đơn đã giao x tỷ lệ hoa hồng
Ví dụ đơn hàng có:

Doanh thu tiệm: 20.000.000đ
Giá vốn NPP: 18.000.000đ
Lãi gộp: 2.000.000đ
Hoa hồng seller: 10% lãi gộp = 200.000đ
Ưu điểm: seller bán càng hiệu quả thì nhận càng tốt, NPP không bị âm biên lợi nhuận.
Nhược điểm: backend bắt buộc phải có giá vốn chuẩn.

Khuyến Mãi Tính Vào Đâu?
Ví dụ giá bán tiệm là 200.000đ/thùng, nhưng có giảm giá 10.000đ/thùng:

Nội dung Giá trị
Giá niêm yết bán tiệm 200.000đ
Giảm giá -10.000đ
Tiền tiệm thực trả 190.000đ
Giá vốn NPP mua từ Nestlé 180.000đ
Lãi gộp NPP thực tế 10.000đ
Không được tính lời dựa trên giá 200.000đ nữa, mà phải dựa trên tiền thực thu sau giảm.

Nếu có tặng sản phẩm, giá vốn hàng tặng cũng phải trừ vào lợi nhuận NPP.

Nên Gắn Vai Trò Duyệt Đơn Cho Ai?
Với hệ thống của bạn, nên phân biệt hai loại đơn:

Loại đơn Người bán Người mua Người duyệt/xuất kho
Đơn cấp hàng NPP Nestlé NPP Admin Nestlé
Đơn bán thị trường NPP Tiệm NPP hoặc quản lý NPP
Hiện backend đang có một loại Order gắn với seller và customer, admin duyệt rồi trừ kho trung tâm. Điều này giống Nestlé đang trực tiếp bán xuống tiệm thông qua seller, chưa thể hiện đúng NPP là chủ hàng/chủ doanh thu.

Backend Nên Nâng Cấp Theo Mô Hình Này
Cần thêm các dữ liệu chính:

ProductPrice {
productId;
priceType: "manufacturer_to_distributor" | "distributor_to_store" | "retail_suggested";
ownerId; // Nestlé hoặc NPP
effectiveFrom;
effectiveTo;
price;
}

DistributorInventory {
distributorId;
productId;
quantity;
averageCost;
}

Order {
orderType: "manufacturer_to_distributor" | "distributor_to_store";
sellerId;
distributorId;
customerId;
sellerEntityId; // bên bán thực tế
buyerEntityId; // bên mua thực tế
}

OrderItem {
unitPrice;
unitCost;
discountAllocated;
netAmount;
grossProfit;
}
Với lương:

CompensationPolicy {
sellerId;
employerDistributorId;
baseSalary;
allowance;
commissionType: "revenue" | "gross_profit";
commissionRate;
kpiBonusRules;
}

Payroll {
sellerId;
distributorId;
month;
baseSalary;
commission;
bonus;
deductions;
finalSalary;
status;
}
Kết Luận

Trong mô hình phù hợp nhất:

Nestlé lời từ việc bán hàng cho NPP.
NPP không nhận lương; NPP lời từ bán hàng cho tiệm và có thể nhận thưởng/chiết khấu từ Nestlé.
Seller là nhân viên của NPP, nhận lương cơ bản cộng hoa hồng/thưởng.
Tiệm lời từ bán lẻ ra thị trường.
Admin Nestlé nên duyệt đơn cấp hàng cho NPP; đơn seller bán cho tiệm nên do NPP quản lý và xuất từ kho NPP.
Backend hiện tại cần tách đơn Nestlé -> NPP và đơn NPP -> tiệm, đồng thời thêm kho NPP, giá vốn và payroll thì mới tính tiền/lời/lương đúng mô hình này.

3:09 PM
vậy bước tạo đơn, thì nên phân luồng như nào có cần tạo cho mối nhà pp 1 kho riêng, vì hiện tại tôi set giá sản phẩm 1 admin là 25k, thì xuất xuống để tạo đơn ra cho tiệm cũng là 25k, có đúng hay sai
3:10 PM

Worked for 45s
Ngắn gọn: nếu 25.000đ là giá Admin/Nestlé bán xuống NPP, rồi seller của NPP tạo đơn bán cho tiệm cũng 25.000đ, thì sai với mô hình NPP kinh doanh độc lập, vì NPP không có phần lời để trả giao hàng, kho, seller và vận hành.

Chỉ đúng trong trường hợp NPP là đơn vị giao hàng hộ/đại lý hưởng hoa hồng riêng, còn hàng hóa và doanh thu bán tiệm vẫn thuộc Nestlé.

Nên Chọn Mô Hình Nào?
Với mô tả của bạn: NPP có seller, có giao hàng cho tiệm, kiếm lời từ phân phối. Vậy nên dùng mô hình:

Nestlé/Admin -> bán sỉ cho NPP -> NPP nhập kho riêng
NPP/Seller -> bán cho Tiệm -> xuất từ kho NPP
Mỗi NPP nên có kho riêng. Không nhất thiết là kho vật lý riêng ngay lập tức, nhưng backend bắt buộc phải theo dõi tồn kho theo từng NPP.

Ví Dụ Giá Đúng
Giả sử sản phẩm sữa có:

Mức giá Người bán Người mua Giá
Giá Nestlé cấp NPP Admin/Nestlé NPP 25.000đ
Giá NPP bán tiệm NPP Tiệm 28.000đ
Giá bán lẻ gợi ý Tiệm Người dùng 32.000đ
Nếu tiệm mua 100 sản phẩm:

Dòng tiền Số tiền
NPP trả Nestlé khi nhập 100 sản phẩm 2.500.000đ
Tiệm trả NPP khi nhận 100 sản phẩm 2.800.000đ
Lãi gộp NPP 300.000đ
Từ 300.000đ, NPP còn trả chi phí giao hàng, lương/hoa hồng seller và các chi phí khác.

Giá 25.000đ Hiện Tại Đang Là Gì?
Trong backend hiện tại, Product.price là giá duy nhất. Khi seller tạo đơn, backend lấy luôn giá này để đưa vào đơn hàng.

Do đó nếu Admin nhập:

Product.price = 25.000đ
thì hệ thống hiện đang hiểu:

Giá bán cho tiệm = 25.000đ
Chứ chưa thể hiện:

Giá Nestlé bán cho NPP = 25.000đ
Giá NPP bán cho tiệm = 28.000đ
Hiện tại hệ thống đang gần với mô hình:

Nestlé sở hữu kho -> Seller tạo đơn cho tiệm -> Admin duyệt -> Nestlé xuất hàng
NPP chưa thực sự là bên mua hàng, giữ kho và bán lại.

Phân Luồng Tạo Đơn Nên Làm
Luồng 1: Admin Cấp Hàng Cho NPP
Người thao tác: Admin hoặc NPP gửi yêu cầu nhập hàng.

Admin chọn NPP
-> chọn sản phẩm và số lượng
-> áp dụng giá cấp NPP: 25.000đ
-> Admin duyệt/xuất kho trung tâm
-> tồn kho Admin giảm
-> tồn kho NPP tăng
-> phát sinh công nợ NPP phải trả Nestlé
Ví dụ:

Đơn cấp hàng:
Người bán: Nestlé
Người mua: NPP Quận 1
Sản phẩm: 1.000 hộp
Đơn giá: 25.000đ
Tổng tiền: 25.000.000đ
Luồng 2: Seller Bán Hàng Cho Tiệm
Người thao tác: Seller thuộc NPP.

Seller check-in tiệm
-> tạo đơn từ danh mục/tồn kho của NPP mình
-> áp dụng giá bán tiệm của NPP: 28.000đ
-> NPP hoặc quản lý NPP duyệt
-> NPP xuất kho/giao hàng cho tiệm
-> tồn kho NPP giảm
-> tiệm trả tiền hoặc ghi công nợ với NPP
Ví dụ:

Đơn bán tiệm:
Người bán: NPP Quận 1
Người mua: Tiệm Minh Anh
Sản phẩm: 100 hộp
Đơn giá: 28.000đ
Tổng tiền: 2.800.000đ
Giá vốn NPP: 25.000đ/hộp
Lãi gộp NPP: 300.000đ
Ai Duyệt Đơn?
Loại đơn Người duyệt phù hợp
Nestlé bán/cấp hàng xuống NPP Admin Nestlé
Seller của NPP bán cho tiệm NPP hoặc quản lý của NPP
Bán dưới giá tối thiểu, giảm giá đặc biệt Có thể yêu cầu Admin duyệt thêm
Không nên để Admin Nestlé duyệt toàn bộ đơn bán tiệm hằng ngày, trừ khi bạn cố tình xây mô hình bán hàng trực tiếp từ hãng.

Có Cần Kho Riêng Cho Mỗi NPP Không?
Có, nếu NPP là bên bán cho tiệm.

Ví dụ cùng một sản phẩm:

Kho Tồn
Kho Nestlé 10.000
Kho NPP Quận 1 1.000
Kho NPP Thủ Đức 800
Khi Admin cấp 500 sản phẩm cho NPP Quận 1:

Kho Nestlé: 10.000 -> 9.500
Kho NPP Quận 1: 1.000 -> 1.500
Khi seller NPP Quận 1 bán 100 sản phẩm cho tiệm:

Kho NPP Quận 1: 1.500 -> 1.400
Kho Nestlé: không đổi
Nếu không có kho NPP, mọi đơn seller bán sẽ trừ thẳng kho Admin. Lúc đó bạn không biết:

NPP đang giữ bao nhiêu hàng.
NPP bán hàng nào lời/lỗ.
NPP nào cần nhập thêm.
Hàng đã cấp xuống nhưng chưa bán cho tiệm nằm ở đâu.
Công nợ giữa Nestlé và NPP.
Dữ Liệu Giá Nên Tách Như Nào?
Không nên tiếp tục dùng một trường price cho tất cả luồng. Ít nhất cần có:

Product {
retailSuggestedPrice: number; // giá bán lẻ gợi ý cho tiệm/người dùng
}

DistributorProduct {
distributorId: string;
productId: string;

purchasePrice: number; // giá NPP mua từ Nestlé, ví dụ 25.000
sellingPrice: number; // giá NPP bán cho tiệm, ví dụ 28.000

stock: number; // tồn của NPP
averageCost: number; // giá vốn bình quân của NPP
}
Tốt hơn nữa là tách lịch sử giá:

PriceList {
ownerType: "manufacturer" | "distributor";
ownerId: string;
customerType: "distributor" | "store";
productId: string;
price: number;
effectiveFrom: Date;
effectiveTo?: Date;
}
Hai Loại Đơn Backend Cần Có
Có thể dùng chung collection orders, nhưng bắt buộc thêm orderType:

Order {
orderType: "manufacturer_to_distributor" | "distributor_to_store";

distributorId: string;
sellerId?: string;
storeId?: string;

sellerEntityId: string;
buyerEntityId: string;

status: "pending" | "approved" | "delivered" | "cancelled" | "returned";
}
Đơn Admin cấp xuống NPP
{
orderType: "manufacturer_to_distributor",
sellerEntityId: "nestle",
buyerEntityId: "npp-quan-1",
unitPrice: 25000
}
Đơn NPP bán cho tiệm
{
orderType: "distributor_to_store",
distributorId: "npp-quan-1",
sellerId: "seller-a",
buyerEntityId: "tiem-minh-anh",
unitPrice: 28000,
unitCost: 25000
}
unitCost phải được snapshot khi giao hàng để sau này giá Nestlé thay đổi, đơn cũ vẫn giữ nguyên lợi nhuận lịch sử.

Nếu Muốn Làm Từng Giai Đoạn
Không cần dựng toàn bộ hệ thống tài chính ngay. Có thể triển khai theo thứ tự:

Giai đoạn 1: Đúng luồng hàng và giá
Thêm kho theo NPP.
Thêm orderType.
Tách giá Admin bán NPP và giá NPP bán tiệm.
Đơn seller chỉ xuất từ kho NPP.
Giai đoạn 2: Lời và công nợ
Snapshot unitCost trên đơn NPP bán tiệm.
Tính lợi nhuận NPP.
Theo dõi NPP nợ Nestlé và tiệm nợ NPP.
Giai đoạn 3: Lương seller
NPP thiết lập lương cơ bản/hoa hồng seller.
Hoa hồng dựa trên đơn đã giao hoặc lợi nhuận đã ghi nhận.
Có điều chỉnh trả hàng.
Kết Luận
Trong trường hợp của bạn:

Admin set giá 25.000đ
Seller của NPP cũng bán tiệm 25.000đ
là không đúng nếu 25.000đ là giá NPP mua từ Nestlé và NPP cần có lời.

Luồng đúng nên là:

Admin bán cho NPP: 25.000đ
NPP nhập vào kho riêng: giá vốn 25.000đ
Seller NPP bán cho tiệm: ví dụ 28.000đ
Tiệm trả tiền cho NPP
NPP lời gộp 3.000đ/sản phẩm
NPP dùng doanh thu/lợi nhuận để trả chi phí và lương seller
Về backend, ưu tiên lớn nhất bây giờ là thêm tồn kho NPP, tách hai loại đơn và tách hai loại giá. Nếu chưa làm ba phần này, báo cáo lời và lương sau đó sẽ không phản ánh đúng hoạt động phân phối.

3:10 PM
tổng lại những việc cần làm
3:11 PM

Tổng Việc Cần Làm
Mô hình nên chốt:

Nestlé/Admin -> bán hàng cho Nhà phân phối (NPP)
NPP -> quản lý kho riêng và bán hàng cho Tiệm
Seller -> nhân viên NPP, đi thị trường tạo đơn bán tiệm
Tiệm -> thanh toán cho NPP
NPP -> thanh toán/công nợ với Nestlé
Hiện hệ thống mới gần với luồng Admin -> Tiệm, dùng chung một giá và một kho. Muốn tính đúng hàng hóa, doanh thu, lợi nhuận và lương thì cần nâng cấp như sau.

1. Tách Giá Bán
   Hiện tại chỉ có Product.price, nên giá Admin đặt 25.000đ cũng trở thành giá seller bán cho tiệm.

Cần tách tối thiểu:

Giá Ý nghĩa Ví dụ
Giá Nestlé bán NPP Giá NPP nhập hàng / giá vốn ban đầu 25.000đ
Giá NPP bán tiệm Giá seller dùng khi lập đơn tiệm 28.000đ
Giá bán lẻ đề xuất Tiệm tham khảo khi bán người dùng 32.000đ
Nên có lịch sử hiệu lực giá để đơn cũ không bị ảnh hưởng khi đổi giá mới.

2. Tạo Kho Riêng Cho Mỗi NPP
   Cần quản lý tồn theo chủ sở hữu:

Kho Nestlé
Kho NPP A
Kho NPP B
...
Luồng tồn kho:

Admin cấp hàng NPP:
Kho Nestlé giảm -> Kho NPP tăng

Seller bán cho tiệm:
Kho NPP giảm -> Kho Nestlé không đổi
Dữ liệu tối thiểu cần có:

Warehouse {
ownerType: "manufacturer" | "distributor";
ownerId: string;
name: string;
}

WarehouseStock {
warehouseId: string;
productId: string;
quantity: number;
averageCost: number;
} 3. Tách Hai Loại Đơn Hàng
Đơn Nestlé Bán Cho NPP
Người tạo/duyệt: Admin
Người bán: Nestlé
Người mua: NPP
Giá áp dụng: Giá Nestlé bán NPP
Xuất kho: Kho Nestlé
Nhập kho: Kho NPP
Phát sinh: NPP phải trả Nestlé
Đơn NPP Bán Cho Tiệm
Người tạo: Seller của NPP
Người duyệt: NPP hoặc quản lý NPP
Người bán: NPP
Người mua: Tiệm
Giá áp dụng: Giá NPP bán tiệm
Xuất kho: Kho NPP
Phát sinh: Tiệm trả/nợ NPP
Có thể dùng chung Order, nhưng thêm:

orderType:
| "manufacturer_to_distributor"
| "distributor_to_store";

distributorId: string;
sellerId?: string;
warehouseId: string;
buyerId: string; 4. Lưu Giá Vốn Và Tính Lợi Nhuận
Khi NPP nhập hàng từ Admin với giá 25.000đ, đó là giá vốn NPP.

Khi seller bán cho tiệm giá 28.000đ, đơn phải snapshot:

OrderItem {
unitPrice: number; // 28.000
unitCost: number; // 25.000
discountAllocated: number;
netAmount: number;
costAmount: number;
grossProfit: number; // 3.000 trước chi phí khác
}
Công thức:

Doanh thu thuần = Giá bán - giảm giá
Lãi gộp = Doanh thu thuần - giá vốn - giá vốn hàng tặng
Nên dùng giá vốn bình quân gia quyền cho giai đoạn đầu.

5. Sửa Cách Ghi Nhận Doanh Thu Và Trả Hàng
   Backend hiện lọc đơn đã giao nhưng tính theo ngày tạo đơn. Cần sửa:

Doanh thu ghi nhận theo deliveredAt
Trả hàng ghi nhận theo returnedAt
Không được xóa doanh thu lịch sử khi đơn bị trả sau đó. Thay vào đó ghi nhận khoản hoàn trả âm ở kỳ hoàn hàng.

Cần báo cáo:

Gross sales
Discount
Returns
Net revenue
COGS
Gross profit
Gross margin 6. Hoàn Thiện Khuyến Mãi
Hiện backend có loại khuyến mãi tặng hàng nhưng chưa thực hiện đầy đủ trong đơn.

Cần xử lý:

Giảm tiền hoặc giảm phần trăm phải phân bổ xuống từng dòng hàng.
Hàng tặng được đưa vào đơn với giá bán 0.
Hàng tặng vẫn phải trừ kho.
Giá vốn hàng tặng phải trừ vào lợi nhuận. 7. Thêm Công Nợ Và Thanh Toán
Cần quản lý hai loại công nợ:

Quan hệ Người trả Người nhận
Đơn cấp hàng NPP NPP Nestlé
Đơn bán tiệm Tiệm NPP
Dữ liệu nên có:

Invoice {
orderId: string;
sellerEntityId: string;
buyerEntityId: string;
totalAmount: number;
paidAmount: number;
remainingAmount: number;
dueDate?: Date;
status: "unpaid" | "partial" | "paid" | "overdue";
}

Payment {
invoiceId: string;
amount: number;
paidAt: Date;
method: "cash" | "transfer";
} 8. Xây Lương Và Hoa Hồng Seller
Seller thuộc NPP, nên NPP trả lương.

Thu nhập seller
= Lương cơ bản

- Phụ cấp
- Hoa hồng
- Thưởng KPI

* Điều chỉnh trả hàng
  Dữ liệu cần thêm:

CompensationPolicy {
sellerId: string;
distributorId: string;
baseSalary: number;
allowance: number;
commissionType: "revenue" | "gross_profit";
commissionRate: number;
}

PayrollPeriod {
distributorId: string;
month: number;
year: number;
status: "draft" | "approved" | "paid" | "locked";
}

PayrollItem {
sellerId: string;
deliveredRevenue: number;
grossProfit: number;
commission: number;
kpiBonus: number;
returnDeduction: number;
totalPay: number;
}
Khuyến nghị: ban đầu có thể tính hoa hồng theo doanh thu giao thành công; khi giá vốn/lợi nhuận ổn định thì chuyển sang hoa hồng theo lợi nhuận hoặc áp điều kiện biên lợi nhuận tối thiểu.

9. Phân Quyền Lại
   Chức năng Admin Nestlé NPP Seller
   Cấu hình giá Nestlé bán NPP Có Không Không
   Tạo/duyệt cấp hàng cho NPP Có Xem/yêu cầu Không
   Cấu hình giá NPP bán tiệm Giám sát Có Xem giá áp dụng
   Xem kho Nestlé Có Không Không
   Xem kho NPP Có Kho mình Tồn bán hàng của NPP mình
   Tạo đơn bán tiệm Có thể hỗ trợ Có Có
   Duyệt/xuất đơn tiệm Giám sát/ngoại lệ Có Không
   Xem lợi nhuận NPP Tùy chính sách Kho mình Không
   Quản lý lương seller Không hoặc giám sát Có Xem phiếu lương mình
10. Cập Nhật Giao Diện
    Web Admin Nestlé
    Màn hình giá bán xuống NPP.
    Đơn cấp hàng cho NPP.
    Kho tổng và tồn theo từng NPP.
    Công nợ NPP.
    Báo cáo doanh thu bán NPP.
    Web NPP
    Kho NPP.
    Cấu hình giá bán tiệm.
    Duyệt/giao đơn seller tạo.
    Công nợ tiệm.
    Lợi nhuận NPP.
    Quản lý lương seller.
    Mobile Seller
    Chỉ thấy hàng tồn khả dụng trong kho NPP mình.
    Tạo đơn theo giá NPP bán tiệm.
    Theo dõi đơn giao thành công.
    Xem KPI, hoa hồng hoặc phiếu lương của bản thân.
    Thứ Tự Triển Khai Khuyến Nghị
    Giai Đoạn 1: Sửa Nền Tảng Luồng Bán Hàng
    Thêm Warehouse và tồn kho theo NPP.
    Thêm orderType.
    Tách giá Nestlé -> NPP và NPP -> Tiệm.
    Chuyển đơn seller sang xuất từ kho NPP.
    Phân quyền duyệt đơn: Admin duyệt cấp NPP, NPP duyệt bán tiệm.
    Giai Đoạn 2: Tài Chính Và Lợi Nhuận
    Lưu giá vốn NPP và snapshot giá vốn vào đơn.
    Sửa ghi nhận doanh thu theo ngày giao.
    Xử lý trả hàng/khuyến mãi đúng tài chính.
    Xây báo cáo doanh thu, giá vốn, lợi nhuận.
    Thêm hóa đơn, thanh toán và công nợ.
    Giai Đoạn 3: Nhân Sự Và Lương
    Thêm chính sách lương/hoa hồng seller.
    Chốt bảng lương theo tháng.
    Điều chỉnh hoa hồng khi trả hàng.
    Hiển thị lương/KPI cho seller trên mobile.
    Ưu Tiên Cần Làm Ngay
    Nếu bắt đầu nâng cấp backend bây giờ, ba việc cần làm đầu tiên là:

Tách hai loại đơn: Nestlé -> NPP và NPP -> Tiệm.
Tạo kho riêng cho từng NPP.
Tách hai loại giá: giá NPP nhập từ Nestlé và giá seller bán cho tiệm.
Chưa hoàn thành ba phần này thì chưa nên phát triển báo cáo lợi nhuận hoặc module lương, vì dữ liệu gốc vẫn đang ghi nhận sai chủ hàng, sai giá và sai nguồn thu.

3:11 PM
bắt đầu từ 1, làm đi
3:13 PM

Worked for 10m 14s
Đã làm xong bước 1: tạo nền kho riêng cho NPP.

Backend đã có module kho mới tại warehouses.service.ts (line 30), warehouse.schema.ts (line 6) và warehouse-stock.schema.ts (line 6):

Kho có loại manufacturer hoặc distributor.
Mỗi NPP chỉ có một kho phân phối.
Tồn được lưu riêng theo warehouse + product.
Có quantity và averageCost để chuẩn bị tính giá vốn/lợi nhuận.
Admin tạo kho và khởi tạo tồn đầu kỳ.
NPP/Seller chỉ đọc được kho thuộc phạm vi của mình.
Tồn đầu kỳ chỉ được khởi tạo một lần, không cho ghi đè tùy ý làm sai lịch sử.
API mới tại warehouses.controller.ts (line 13):

POST /warehouses
GET /warehouses
GET /warehouses/:warehouseId/stocks
POST /warehouses/:warehouseId/stocks
Web Admin đã có màn hình mới /admin/warehouses tại page.tsx (line 54):

Menu Kho NPP.
Tạo kho cho từng nhà phân phối.
Chọn kho để xem tồn.
Khởi tạo số lượng và giá vốn bình quân cho từng sản phẩm.
Tự ẩn sản phẩm đã được khởi tạo trong kho đó.
Lớp gọi API frontend nằm tại warehouseService.ts (line 11), đã đăng ký Redux store tại store.ts (line 22).

Lưu ý phạm vi hiện tại

Luồng đơn cũ chưa bị thay đổi: seller vẫn đang tạo đơn theo Product.price và tồn trung tâm hiện hữu. Kho NPP hiện đã sẵn nền dữ liệu, nhưng chưa có luồng Admin cấp hàng -> kho NPP tăng hoặc Seller bán tiệm -> kho NPP giảm.

Kiểm tra

dms-backend: npm run build thành công.
dms-frontend: npm run build thành công, route /admin/warehouses đã được build nhận diện.

Edited 15 files
+1,464
-80
Undo
Review
app.module.ts
create-warehouse.dto.ts
set-warehouse-stock.dto.ts

Show 12 more files

3:23 PM
