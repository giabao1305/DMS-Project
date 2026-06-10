# Phần viết tiếp cho báo cáo DMS

## Bảng phân quyền tác nhân

Sau khi xác định các tác nhân chính của hệ thống, việc phân quyền chức năng giúp làm rõ phạm vi thao tác của từng nhóm người dùng. Hệ thống DMS được thiết kế theo hướng mỗi người dùng chỉ được truy cập vào các chức năng phù hợp với vai trò và phạm vi dữ liệu được giao. Cách tiếp cận này giúp đảm bảo tính bảo mật, hạn chế việc thao tác nhầm dữ liệu ngoài trách nhiệm, đồng thời hỗ trợ quá trình quản lý tập trung của doanh nghiệp.

| Nhóm chức năng | Quản trị viên | Nhà phân phối | Nhân viên bán hàng |
| --- | --- | --- | --- |
| Đăng nhập, đăng xuất, đổi mật khẩu | Có | Có | Có |
| Quản lý người dùng | Có | Xem đội DSR thuộc quyền | Không |
| Quản lý khách hàng | Có | Có trong phạm vi phụ trách | Có với khách hàng của mình |
| Duyệt khách hàng | Có | Có theo phạm vi | Không |
| Quản lý sản phẩm, danh mục | Có | Xem sản phẩm | Xem sản phẩm được bán |
| Quản lý kho hàng | Có | Quản lý kho nhà phân phối | Xem tồn kho phục vụ bán hàng |
| Quản lý đơn hàng | Có | Có trong phạm vi phụ trách | Tạo và theo dõi đơn của mình |
| Quản lý tuyến bán hàng | Có | Tạo và theo dõi tuyến của đội | Xem tuyến được giao |
| Check-in/check-out ghé thăm | Theo dõi | Theo dõi đội DSR | Thực hiện trên ứng dụng di động |
| Quản lý nghỉ phép | Duyệt và theo dõi | Duyệt trong phạm vi đội | Tạo và theo dõi đơn nghỉ |
| Quản lý KPI | Có | Theo dõi KPI đội | Xem KPI cá nhân |
| Báo cáo, thống kê | Có | Xem báo cáo theo phạm vi | Xem chỉ số cá nhân |
| Thông báo | Có | Có | Có |
| Nhật ký thao tác | Có | Không | Không |

Bảng phân quyền trên cho thấy quản trị viên là tác nhân có quyền quản lý tổng thể, nhà phân phối tập trung vào dữ liệu của đội ngũ phụ trách, còn nhân viên bán hàng chủ yếu thực hiện các nghiệp vụ phát sinh ngoài thị trường. Việc giới hạn phạm vi thao tác theo vai trò giúp hệ thống phù hợp với cấu trúc vận hành của doanh nghiệp phân phối.

## Phân tích các ca sử dụng chính

### Ca sử dụng đăng nhập hệ thống

Ca sử dụng đăng nhập cho phép người dùng truy cập vào hệ thống bằng tài khoản được cấp. Người dùng nhập email và mật khẩu, sau đó hệ thống gửi yêu cầu đến backend để xác thực. Nếu thông tin hợp lệ, hệ thống trả về thông tin người dùng, access token và refresh token. Dựa trên vai trò của người dùng, giao diện sẽ hiển thị các chức năng phù hợp.

Trong trường hợp thông tin đăng nhập không đúng, hệ thống hiển thị thông báo lỗi rõ ràng để người dùng kiểm tra lại. Nếu tài khoản bị khóa hoặc không còn hoạt động, hệ thống không cho phép đăng nhập. Ca sử dụng này là điểm bắt đầu của hầu hết các luồng nghiệp vụ khác, đồng thời là cơ chế quan trọng để bảo vệ dữ liệu trong hệ thống.

### Ca sử dụng quản lý khách hàng

Chức năng quản lý khách hàng được sử dụng để lưu trữ và cập nhật thông tin điểm bán. Nhân viên bán hàng có thể tạo mới khách hàng trên ứng dụng di động khi phát sinh điểm bán mới ngoài thị trường. Thông tin khách hàng bao gồm tên khách hàng, tên chủ cửa hàng, số điện thoại, địa chỉ, loại khách hàng và tọa độ vị trí nếu có.

Sau khi khách hàng được tạo, hệ thống có thể đưa khách hàng vào trạng thái chờ duyệt. Quản trị viên hoặc nhà phân phối kiểm tra thông tin và thực hiện duyệt hoặc từ chối. Khi khách hàng được duyệt, nhân viên bán hàng có thể sử dụng khách hàng đó trong các nghiệp vụ tiếp theo như lập tuyến, check-in và tạo đơn hàng.

Chức năng này giúp doanh nghiệp quản lý tập trung danh sách điểm bán, hạn chế trùng lặp thông tin và đảm bảo chỉ các khách hàng hợp lệ mới được tham gia vào quy trình bán hàng.

### Ca sử dụng quản lý tuyến bán hàng

Quản lý tuyến bán hàng cho phép quản trị viên hoặc nhà phân phối lập kế hoạch làm việc cho nhân viên bán hàng. Mỗi tuyến có các thông tin như tên tuyến, ngày làm việc, nhân viên phụ trách, danh sách khách hàng cần ghé thăm và thứ tự thực hiện.

Khi tuyến được tạo, nhân viên bán hàng có thể xem danh sách tuyến được giao trên ứng dụng di động. Trong quá trình làm việc, nhân viên thực hiện check-in tại từng điểm bán và hệ thống cập nhật trạng thái của điểm bán trong tuyến. Nhà phân phối và quản trị viên có thể theo dõi tiến độ thực hiện tuyến thông qua dữ liệu ghé thăm được ghi nhận.

Chức năng tuyến bán hàng giúp hoạt động thị trường có kế hoạch hơn, đồng thời tạo cơ sở để đánh giá mức độ hoàn thành công việc của nhân viên bán hàng.

### Ca sử dụng check-in/check-out ghé thăm

Check-in/check-out là chức năng cốt lõi của ứng dụng di động DMS Seller. Khi nhân viên bán hàng đến điểm bán, nhân viên chọn khách hàng hoặc điểm trong tuyến, sau đó thực hiện check-in. Ứng dụng lấy vị trí hiện tại của thiết bị và gửi các thông tin gồm khách hàng, tuyến nếu có, thời gian, vĩ độ, kinh độ và ghi chú lên backend.

Khi kết thúc quá trình làm việc tại điểm bán, nhân viên thực hiện check-out. Hệ thống tiếp tục ghi nhận thời gian kết thúc, vị trí check-out và ghi chú nếu có. Dữ liệu này giúp nhà quản lý biết được nhân viên đã ghé điểm bán nào, vào thời điểm nào và hoàn thành công việc ra sao.

Trong thực tế, chức năng này cần xử lý các trường hợp như chưa cấp quyền vị trí, GPS yếu, không lấy được tọa độ hoặc nhân viên đang có một lượt ghé thăm chưa kết thúc. Việc kiểm soát các điều kiện này giúp dữ liệu ghé thăm có tính chính xác và phản ánh đúng hoạt động ngoài thị trường.

### Ca sử dụng tạo và quản lý đơn hàng

Chức năng đơn hàng cho phép nhân viên bán hàng tạo đơn trực tiếp trên ứng dụng di động sau khi làm việc với khách hàng. Nhân viên chọn khách hàng, chọn sản phẩm, nhập số lượng, áp dụng khuyến mãi nếu có và nhập ghi chú đơn hàng. Hệ thống tính tổng tiền, giảm giá và giá trị thanh toán của đơn hàng.

Sau khi đơn hàng được tạo, quản trị viên hoặc nhà phân phối có thể theo dõi và xử lý đơn theo quy trình nghiệp vụ. Đơn hàng có thể trải qua các trạng thái như chờ duyệt, đã duyệt, đã giao, yêu cầu trả hàng, đã hủy hoặc đã trả hàng. Khi đơn hàng được giao, hệ thống có thể cập nhật tồn kho và ghi nhận các thông tin liên quan đến doanh thu, công nợ và lợi nhuận.

Chức năng quản lý đơn hàng giúp doanh nghiệp theo dõi toàn bộ quá trình bán hàng từ khi phát sinh nhu cầu tại điểm bán đến khi giao hàng và thanh toán. Đây là một trong những dữ liệu quan trọng nhất phục vụ báo cáo và đánh giá hiệu quả kinh doanh.

### Ca sử dụng thanh toán và công nợ

Thanh toán và công nợ giúp hệ thống ghi nhận số tiền khách hàng đã thanh toán cho đơn hàng. Người dùng có thể cập nhật số tiền thanh toán, phương thức thanh toán và ghi chú liên quan. Hệ thống dựa vào tổng giá trị đơn hàng và số tiền đã thu để xác định trạng thái thanh toán như chưa thanh toán, thanh toán một phần hoặc đã thanh toán.

Trong trường hợp phát sinh hoàn tiền hoặc trả hàng, hệ thống cần cập nhật lại số tiền đã thu, số tiền còn lại và trạng thái công nợ. Các dữ liệu này giúp bộ phận quản lý theo dõi dòng tiền, kiểm soát các khoản phải thu và đánh giá tình hình tài chính của hoạt động bán hàng.

### Ca sử dụng quản lý KPI

Chức năng KPI được sử dụng để theo dõi mục tiêu và kết quả thực hiện của nhân viên bán hàng. KPI có thể bao gồm doanh thu mục tiêu, doanh thu thực tế, số đơn hàng mục tiêu, số đơn hàng thực tế, số lượt ghé thăm mục tiêu và số lượt ghé thăm thực tế trong tháng.

Nhân viên bán hàng có thể xem KPI cá nhân trên ứng dụng di động để biết mức độ hoàn thành công việc. Nhà phân phối và quản trị viên có thể theo dõi KPI của đội ngũ nhân viên để đánh giá hiệu quả làm việc. Việc gắn KPI với dữ liệu thực tế từ đơn hàng và lượt ghé thăm giúp quá trình đánh giá có cơ sở rõ ràng hơn.

### Ca sử dụng thông báo

Thông báo giúp hệ thống gửi các cập nhật quan trọng đến người dùng. Các thông báo có thể liên quan đến đơn hàng, tuyến bán hàng, nghỉ phép, khách hàng, kho hàng, khuyến mãi hoặc các nội dung hệ thống. Người dùng có thể xem danh sách thông báo, mở chi tiết thông báo và đánh dấu đã đọc.

Chức năng thông báo giúp người dùng nắm bắt sự kiện mới kịp thời, đặc biệt trong các tình huống cần phản hồi nhanh như đơn hàng mới, thay đổi trạng thái, duyệt nghỉ phép hoặc phân công tuyến bán hàng. Đối với ứng dụng di động, thông báo góp phần giảm việc người dùng phải kiểm tra thủ công từng màn hình.

## Quy trình nghiệp vụ tiêu biểu

### Quy trình tạo khách hàng và duyệt khách hàng

Quy trình tạo khách hàng bắt đầu khi nhân viên bán hàng phát hiện một điểm bán mới. Nhân viên mở ứng dụng DMS Seller, nhập thông tin khách hàng và gửi lên hệ thống. Backend lưu thông tin khách hàng mới và gán trạng thái chờ duyệt nếu quy trình yêu cầu kiểm tra trước khi sử dụng.

Sau đó, quản trị viên hoặc nhà phân phối truy cập giao diện web để xem danh sách khách hàng đang chờ duyệt. Nếu thông tin hợp lệ, người quản lý thực hiện duyệt khách hàng. Nếu thông tin chưa đầy đủ hoặc không phù hợp, người quản lý có thể từ chối và nhập lý do. Kết quả duyệt được cập nhật về hệ thống và nhân viên bán hàng có thể theo dõi trạng thái trên ứng dụng.

Quy trình này giúp doanh nghiệp kiểm soát chất lượng dữ liệu khách hàng, tránh việc đưa các điểm bán sai thông tin vào quy trình bán hàng.

### Quy trình tuyến bán hàng, ghé thăm và tạo đơn

Quy trình tuyến bán hàng bắt đầu khi quản trị viên hoặc nhà phân phối lập tuyến cho nhân viên bán hàng. Tuyến bao gồm ngày làm việc và danh sách khách hàng cần ghé thăm theo thứ tự. Khi đến ngày làm việc, nhân viên bán hàng mở ứng dụng để xem tuyến được giao.

Tại mỗi điểm bán, nhân viên thực hiện check-in để ghi nhận thời gian và vị trí. Sau khi trao đổi với khách hàng, nếu phát sinh nhu cầu mua hàng, nhân viên tạo đơn hàng trực tiếp trên ứng dụng. Đơn hàng được gửi về backend và xuất hiện trên giao diện quản lý của nhà phân phối hoặc quản trị viên.

Sau khi hoàn thành công việc tại điểm bán, nhân viên check-out. Trạng thái lượt ghé thăm và tiến độ tuyến được cập nhật. Nhà quản lý có thể theo dõi số điểm đã ghé, số điểm còn lại và các đơn hàng phát sinh trong ngày. Quy trình này thể hiện mối liên kết giữa lập kế hoạch, thực thi ngoài thị trường và quản lý đơn hàng.

### Quy trình xử lý đơn hàng và cập nhật kho

Sau khi đơn hàng được tạo, đơn ở trạng thái chờ xử lý hoặc chờ duyệt tùy theo quy định nghiệp vụ. Nhà phân phối hoặc quản trị viên kiểm tra thông tin đơn hàng, bao gồm khách hàng, sản phẩm, số lượng, giá bán, khuyến mãi và ghi chú. Nếu đơn hợp lệ, người quản lý duyệt đơn và thực hiện các bước giao hàng.

Khi đơn hàng được giao thành công, hệ thống cập nhật trạng thái đơn hàng sang đã giao. Đồng thời, số lượng tồn kho liên quan có thể được trừ từ kho phù hợp. Nếu đơn hàng thuộc seller của nhà phân phối, giá bán có thể được lấy theo giá bán tại kho nhà phân phối. Hệ thống cũng có thể ghi nhận giá vốn, doanh thu, lợi nhuận và công nợ phát sinh.

Trong trường hợp đơn hàng bị hủy hoặc trả hàng, hệ thống cập nhật lại trạng thái đơn và xử lý các dữ liệu liên quan đến tồn kho, thanh toán và công nợ. Quy trình này giúp đảm bảo dữ liệu đơn hàng và kho hàng được đồng bộ với nhau.

### Quy trình nghỉ phép

Nhân viên bán hàng có thể tạo đơn nghỉ phép trên ứng dụng di động bằng cách chọn ngày bắt đầu, ngày kết thúc và nhập lý do nghỉ. Đơn nghỉ sau khi gửi lên hệ thống sẽ ở trạng thái chờ duyệt. Nhà phân phối hoặc quản trị viên xem danh sách đơn nghỉ và thực hiện duyệt hoặc từ chối.

Nếu đơn nghỉ được duyệt, nhân viên bán hàng có thể xem trạng thái mới trên ứng dụng. Nếu đơn bị từ chối, hệ thống hiển thị lý do để nhân viên nắm thông tin. Quy trình nghỉ phép giúp doanh nghiệp quản lý lịch làm việc của nhân viên bán hàng và có cơ sở điều chỉnh tuyến bán hàng khi cần thiết.

## Thiết kế dữ liệu mức tổng quan

Hệ thống DMS sử dụng cơ sở dữ liệu MongoDB để lưu trữ dữ liệu nghiệp vụ. MongoDB phù hợp với hệ thống vì dữ liệu có nhiều nhóm đối tượng khác nhau, có quan hệ linh hoạt và cần khả năng mở rộng theo từng module. Các collection chính của hệ thống có thể bao gồm users, customers, products, categories, warehouses, warehouse_stocks, inventory_transactions, promotions, routes, visits, orders, leaves, notifications, kpis và audit_logs.

Collection users lưu thông tin tài khoản người dùng, vai trò, trạng thái hoạt động và quan hệ quản lý. Vai trò người dùng là cơ sở để backend kiểm tra quyền truy cập và giới hạn dữ liệu trả về cho từng người dùng.

Collection customers lưu thông tin khách hàng và điểm bán. Mỗi khách hàng có các thông tin như tên, số điện thoại, địa chỉ, tọa độ, người phụ trách, loại khách hàng và trạng thái duyệt. Dữ liệu khách hàng được sử dụng trong các nghiệp vụ tuyến bán hàng, ghé thăm và đơn hàng.

Collection products và categories lưu thông tin sản phẩm và nhóm sản phẩm. Sản phẩm có các trường như mã sản phẩm, tên sản phẩm, đơn vị tính, giá, tồn kho cơ bản, hình ảnh và trạng thái kinh doanh. Các thông tin này được sử dụng khi tạo đơn hàng và theo dõi doanh thu.

Collection warehouses, warehouse_stocks và inventory_transactions phục vụ quản lý kho. Warehouses lưu thông tin kho, warehouse_stocks lưu số lượng tồn theo từng sản phẩm trong từng kho, còn inventory_transactions ghi nhận lịch sử nhập, xuất và điều chỉnh tồn kho. Nhóm dữ liệu này giúp hệ thống theo dõi hàng hóa trong quá trình phân phối.

Collection routes lưu kế hoạch tuyến bán hàng, bao gồm nhân viên phụ trách, ngày làm việc, danh sách khách hàng trong tuyến và trạng thái từng điểm. Collection visits lưu các lượt ghé thăm thực tế của nhân viên bán hàng, gồm thời gian check-in/check-out, tọa độ và ghi chú. Hai collection này liên kết chặt chẽ để phản ánh kế hoạch và kết quả thực hiện ngoài thị trường.

Collection orders lưu thông tin đơn hàng, danh sách sản phẩm, tổng tiền, giảm giá, trạng thái đơn, thanh toán, công nợ và lợi nhuận nếu có. Đơn hàng có liên kết với khách hàng và nhân viên bán hàng, đồng thời có liên quan đến kho khi đơn được giao.

Collection leaves, notifications, kpis và audit_logs hỗ trợ các chức năng bổ sung. Leaves lưu đơn nghỉ phép, notifications lưu thông báo gửi đến người dùng, kpis lưu mục tiêu và kết quả thực hiện, còn audit_logs ghi nhận các thao tác quan trọng trong hệ thống. Các collection này giúp hệ thống hoàn thiện hơn về mặt quản lý, theo dõi và kiểm soát.

## Kết luận phần phân tích

Qua quá trình phân tích yêu cầu, tác nhân, ca sử dụng và dữ liệu, có thể thấy hệ thống DMS được xây dựng nhằm giải quyết bài toán quản lý phân phối theo hướng tập trung và đồng bộ. Hệ thống không chỉ hỗ trợ bộ phận quản lý theo dõi dữ liệu trên web, mà còn cung cấp ứng dụng di động cho nhân viên bán hàng làm việc trực tiếp ngoài thị trường.

Các chức năng như quản lý khách hàng, tuyến bán hàng, check-in/check-out, đơn hàng, kho hàng, thanh toán, KPI và thông báo có mối liên kết chặt chẽ với nhau. Dữ liệu phát sinh từ một nghiệp vụ có thể được sử dụng cho nhiều mục đích khác nhau như theo dõi tiến độ, xử lý đơn hàng, tính doanh thu, cập nhật tồn kho và đánh giá hiệu quả làm việc.

Phần phân tích trên là cơ sở để thiết kế kiến trúc hệ thống, thiết kế cơ sở dữ liệu, xây dựng giao diện và triển khai các module chức năng trong các phần tiếp theo của báo cáo.
